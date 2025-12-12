import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	cookies.delete('userId', { path: '/' });
	throw redirect(303, '/');
};
