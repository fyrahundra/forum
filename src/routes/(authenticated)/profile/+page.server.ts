import type { ServerLoad, Actions } from '@sveltejs/kit';
import { getUser } from '$lib/auth';
import { prisma } from '$lib';
import { fail } from '@sveltejs/kit';
import { validateImageFile } from '$lib/validation';

import { Buffer } from 'buffer';
import { cloudinary } from '$lib/cloudinary';

export const load: ServerLoad = async ({ cookies }) => {
	let user = await getUser(cookies);
	return { user };
};

// Din uppgift: Implementera upload-logiken
export const actions: Actions = {
	uploadToFile: async ({ request }) => {
		const data = await request.formData();
		const file = data.get('image') as File;

		if (!file || !(file instanceof File)) {
			return fail(400, { success: false, error: 'No file uploaded' });
		}

		try {
			validateImageFile(file);
		} catch (error) {
			return fail(400, { success: false, error: error.message });
		}

		try {
			const buffer = Buffer.from(await file.arrayBuffer());

			const upload = await new Promise<{ secure_url: string; public_id: string }>(
				(resolve, reject) => {
					const stream = cloudinary.uploader.upload_stream(
						{
							folder: 'forum-app/profile',
							resource_type: 'image',
							quality: 'auto',
							width: 512,
							crop: 'limit'
						},
						(error, result) => {
							if (error || !result) return reject(error);
							resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
						}
					);
					stream.end(buffer);
				}
			);

			await prisma.user.update({
				where: { id: data.get('userId') as string },
				data: { profileImage: upload.secure_url }
			});

			return { success: true, filename: upload.public_id };
		} catch (error) {
			console.error('Upload error:', error);
			return fail(500, { success: false, error: 'Failed to upload file' });
		}
	}
};
