import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getUser, requireAuth } from '$lib/auth';
import { prisma } from '$lib';

export const load: LayoutServerLoad = async ({ cookies, parent }) => {
	const parentData = await parent();

	const userId = await getUser(cookies);

	if (!userId) {
		throw redirect(302, '/login');
	}

	const user = await prisma.user.findUnique({
		where: { id: userId.id }
	});

	if (!user) {
		cookies.delete('userId', { path: '/' });
		throw redirect(302, '/login');
	}

	return {
		user: user
	};
};
