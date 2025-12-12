import type { ServerLoad, Actions } from '@sveltejs/kit';
import { getUser } from '$lib/auth';
import { prisma } from '$lib';
import { fail } from '@sveltejs/kit';
import { validateImageFile } from '$lib/validation';

import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { Buffer } from 'buffer';
import { existsSync } from 'fs';

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
			// Ensure uploads directory exists
			const uploadsDir = path.join('static', 'uploads');
			if (!existsSync(uploadsDir)) {
				await mkdir(uploadsDir, { recursive: true });
			}

			// Skapa unikt filnamn
			const filename = `${Date.now()}-${file.name}`;
			const filepath = path.join(uploadsDir, filename);
			
			// Spara fil
			const buffer = Buffer.from(await file.arrayBuffer());
			await writeFile(filepath, buffer);
			
			// Spara bara filnamn i databas
			await prisma.user.update({
				where: { id: data.get('userId') as string },
				data: { profileImage: filename }
			});

			return { success: true, filename };
		} catch (error) {
			console.error('Upload error:', error);
			return fail(500, { success: false, error: 'Failed to upload file' });
		}
	}
};
