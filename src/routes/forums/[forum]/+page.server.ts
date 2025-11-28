// src/routes/forums/[forum]/+page.server.ts
import { prisma } from '$lib';
import { fail } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { ServerLoad, Actions } from '@sveltejs/kit';
import { wsManager } from '$lib/websocket';
import { requireAuth } from '$lib/auth';

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
	message: async ({ request, params, cookies }) => {
		// Skapa nytt meddelande med Prisma
		// Tips: använd connect för att koppla till forum
		const user = await requireAuth(cookies);
		const forumName = params.forum;
		const data = await request.formData();
		const content = data.get('content')?.toString();
		const author = user?.username ?? 'Anonymous';
		const userId = user?.id ?? null;

		if (!content || !author) {
			return fail(400, { error: 'Innehåll och författare krävs' });
		}

		try {
			await prisma.message.create({
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

			wsManager.broadcast({
				type: 'forum_update',
				forums: await prisma.forum.findMany({
					include: { _count: { select: { messages: true } } },
					orderBy: { createdAt: 'desc' }
				})
			});

			const updatedForum = await prisma.forum.findUnique({
				where: { name: forumName },
				include: {
					_count: { select: { messages: true } },
					messages: true
				}
			});

			if (!updatedForum) {
				return fail(404, { error: 'Forum hittades inte' });
			}

			wsManager.broadcast({
				type: 'message_update',
				message: await prisma.message.findMany({
					where: { forumId: updatedForum.id },
					orderBy: { createdAt: 'desc' },
					take: 10
				})
			});

			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Kunde ej skapa meddelande' });
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

			wsManager.broadcast({
				type: 'forum_update',
				forums: await prisma.forum.findMany({
					include: { _count: { select: { messages: true } } },
					orderBy: { createdAt: 'desc' }
				})
			});

			wsManager.broadcast({
				type: 'message_update',
				message: await prisma.message.findMany({
					orderBy: { createdAt: 'desc' },
					take: 10
				})
			});
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
			wsManager.broadcast({
				type: 'message_update',
				message: await prisma.message.findMany({
					orderBy: { createdAt: 'desc' },
					take: 10
				})
			});
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
