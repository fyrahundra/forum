import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getUser } from '$lib/auth';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const user = await getUser(cookies);

	if (user) {
		throw redirect(302, '/forums');
	}
};
