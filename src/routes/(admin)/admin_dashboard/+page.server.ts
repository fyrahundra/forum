import type { PageServerLoad } from './$types';
import { prisma } from '$lib';

export const load: PageServerLoad = async () => {
	const now = new Date();

	const activeSessions = await prisma.session.findMany({
		where: { expiresAt: { gt: now } },
		include: {
			user: { select: { id: true, username: true, email: true, role: true } }
		},
		orderBy: { lastUsed: 'desc' }
	});

	return { activeSessions };
};
