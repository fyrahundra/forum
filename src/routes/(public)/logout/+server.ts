import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib';

export const POST = async ({ cookies }) => {
	await prisma.session.deleteMany({
		where: {
			token: cookies.get('sessionToken')
		}
	});
	cookies.delete('sessionToken', { path: '/' });
	throw redirect(303, '/login');
};
