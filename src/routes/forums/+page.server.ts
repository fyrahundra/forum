// src/routes/forums/+page.server.ts
import type { ServerLoad, Actions } from '@sveltejs/kit';
import { prisma } from '$lib';
import { error, fail } from '@sveltejs/kit';
import { wsManager } from '$lib/websocket';
import { getUser, requireAuth } from '$lib/auth';

export const load = (async ({ url, params, cookies }) => {
	const user = await getUser(cookies);
	// Hur skulle du hämta alla forum från databasen?
	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = 5; // messages per page

	const forums = await prisma.forum.findMany({
		include: {
			_count: {
				select: { messages: true }
			}
		},
		orderBy: { createdAt: 'desc' },
		skip: (page - 1) * pageSize,
		take: pageSize
	});

	const totalForums = await prisma.forum.count();

	const totalPages = Math.ceil(totalForums / pageSize);

	return { forums, page, pageSize, totalForums, totalPages, user: user };
}) satisfies ServerLoad;

export const actions = {
	create: async ({ request, cookies }) => {
		const user = await requireAuth(cookies);
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const userId = user?.id ?? null;

		// Validering här...
		if (!name) {
			return fail(422, { error: 'Namn är obligatoriskt', name, description });
		}
		if (!user) {
			return fail(401, { error: 'Du måste vara inloggad för att skapa ett forum' });
		}

		try {
			// Hur skulle du skapa ett nytt forum?
			// Tips: prisma.forum.create({ data: { ... } })
			await prisma.forum.create({
				data: {
					name,
					description,
					user: { connect: { id: userId } }
				}
			});

			console.log('[action] broadcasting forum_update, clients:', wsManager.getClientCount());
			wsManager.broadcast({
				type: 'forum_update',
				forums: await prisma.forum.findMany({
					include: { _count: { select: { messages: true } } },
					orderBy: { createdAt: 'desc' }
				})
			});

			return { success: true };
		} catch (error) {
			// Vad händer om forum-namnet redan finns?
			if (error.code === 'P2002') {
				return fail(400, { error: 'Forum finns redan' });
			}
			return fail(500, { error: 'Kunde Inte Skapa Forum' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const forumId = data.get('id')?.toString();
		console.log('Deleting forum with ID:', forumId);

		if (!forumId) {
			return fail(400, { error: 'Forum ID krävs' });
		}

		try {
			await prisma.forum.delete({
				where: { id: forumId }
			});

			wsManager.broadcast({
				type: 'forum_update',
				forums: await prisma.forum.findMany({
					include: { _count: { select: { messages: true } } },
					orderBy: { createdAt: 'desc' }
				})
			});
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'Något gick fel vid borttagning' });
		}
	},
	edit: async ({ request }) => {
		const data = await request.formData();
		const forumId = data.get('id')?.toString();
		const newDescription = data.get('description')?.toString();

		if (!forumId || !newDescription) {
			return fail(400, { error: 'Forum ID och beskrivning krävs' });
		}

		try {
			await prisma.forum.update({
				where: { id: forumId },
				data: { description: newDescription }
			});

			wsManager.broadcast({
				type: 'forum_update',
				forums: await prisma.forum.findMany({
					include: { _count: { select: { messages: true } } },
					orderBy: { createdAt: 'desc' }
				})
			});
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'Något gick fel vid uppdatering' });
		}
	}
} satisfies Actions;
