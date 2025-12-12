// src/routes/forums/[forum]/+page.server.ts
import { prisma } from '$lib';
import { fail, error } from '@sveltejs/kit';
import type { ServerLoad, Actions } from '@sveltejs/kit';
import { requireAuth, getUser } from '$lib/auth';
import { Buffer } from 'buffer';
import { validateImageFile } from '$lib/validation';
import { cloudinary } from '$lib/cloudinary';

export const load: ServerLoad = async ({ params, url, cookies }) => {
	const user = await requireAuth(cookies);
	const filter = url.searchParams.get('filter');
	const forumName = params.forum;
	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = 10; // messages per page

	const forum = await prisma.forum.findUnique({
		where: { name: forumName }
	});

	if (!forum) {
		throw error(404, 'Forum hittades inte');
	}

	const totalMessages = await prisma.message.count({
		where: { forumId: forum.id }
	});

	const messages = await prisma.message.findMany({
		where: {
			forumId: forum.id,
			...(filter ? { content: { contains: filter } } : {})
		},
		include: {
			images: true,
			user: {
				select: {
					id: true,
					username: true,
					profileImage: true
				}
			}
		},
		orderBy: { createdAt: 'desc' },
		skip: (page - 1) * pageSize,
		take: pageSize
	});

	return {
		forum,
		messages,
		page,
		pageSize,
		totalMessages,
		totalPages: Math.ceil(totalMessages / pageSize),
		user: user
	};
};

export const actions = {
	uploadToFile: async ({ request }) => {},
	message: async ({ request, params, cookies }) => {
		// Skapa nytt meddelande med Prisma
		// Tips: använd connect för att koppla till forum
		const user = await requireAuth(cookies);
		const forumName = params.forum;
		const data = await request.formData();
		const content = data.get('content')?.toString();
		const author = user?.username ?? 'Anonymous';
		const userId = user?.id ?? null;

		const attachments = data.getAll('attachment') as File[];

		if (!content || !author) {
			return fail(400, { error: 'Innehåll och författare krävs' });
		}

		if (!attachments || !(attachments[0] instanceof File)) {
			return fail(400, { success: false, error: 'No file uploaded' });
		}

		try {
			let message = await prisma.message.create({
				data: {
					content: content,
					author: author,
					forum: {
						connect: { name: forumName }
					},
					user: {
						connect: { id: userId }
					}
				}
			});

			// Hantera filuppladdningar om några finns
			if (attachments && attachments.length > 0 && attachments[0].size > 0) {
				for (const file of attachments) {
					try {
						validateImageFile(file);
					} catch (error) {
						return fail(400, {
							success: false,
							error: `File ${file.name} error: ${error.message}`
						});
					}

					const buffer = Buffer.from(await file.arrayBuffer());

					try {
						// Upload to Cloudinary
						const upload = await new Promise<{ secure_url: string; public_id: string }>(
							(resolve, reject) => {
								const stream = cloudinary.uploader.upload_stream(
									{
										folder: 'forum-app/messages',
										resource_type: 'image',
										quality: 'auto',
										width: 800,
										crop: 'scale'
									},
									(error, result) => {
										if (error || !result) return reject(error);
										resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
									}
								);
								stream.end(buffer);
							}
						);

						// Spara Cloudinary-referenser i databas
						await prisma.image.create({
							data: {
								filename: upload.public_id, // store public_id
								data: upload.secure_url, // store secure URL
								message: { connect: { id: message.id } }
							}
						});
					} catch (error) {
						console.error('Cloudinary upload error:', error);
						return fail(500, { success: false, error: `Failed to upload file ${file.name}` });
					}
				}
			}

			return { success: true, messageId: message.id };
		} catch (error) {
			console.error('Message creation error:', error);
			return fail(500, { error: 'Något gick fel vid skapandet av meddelandet' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const messageId = data.get('id')?.toString();

		if (!messageId) {
			return fail(400, { error: 'Meddelande ID krävs' });
		}

		try {
			await prisma.message.delete({
				where: { id: messageId }
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Något gick fel vid borttagning' });
		}
	},
	edit: async ({ request }) => {
		const data = await request.formData();
		const messageId = data.get('id')?.toString();
		const newContent = data.get('content')?.toString();

		if (!messageId || !newContent) {
			return fail(400, { error: 'Meddelande ID och innehåll krävs' });
		}
		try {
			await prisma.message.update({
				where: { id: messageId },
				data: { content: newContent }
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Något gick fel vid uppdatering' });
		}
	},
	find: async ({ request, params }) => {
		const forumName = params.forum;
		const data = await request.formData();
		const searchText = data.get('searchText')?.toString();
		if (!searchText) {
			return fail(400, { error: 'Söktext krävs' });
		}
		if (!forumName) {
			return fail(400, { error: 'Forum namn krävs' });
		}
		try {
			const foundMessages = await prisma.message.findMany({
				where: {
					content: { contains: searchText }
				}
			});
			console.log('Found messages:', foundMessages);

			return { foundMessages };
		} catch (error) {
			return fail(500, { error: 'Något gick fel vid sökning' });
		}
	}
} satisfies Actions;
