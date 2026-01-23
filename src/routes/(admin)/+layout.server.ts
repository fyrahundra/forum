import type { LayoutServerLoad } from './$types';
import { prisma } from '$lib';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) throw redirect(302, '/forums');

	const session = await prisma.session.findFirst({
		where: { token: sessionToken ?? '' },
		include: { user: true }
	});

	if (!session || session.user.role !== 'admin') throw redirect(302, '/forums');

	return { user: session.user };
};
