import { getUser } from '$lib/auth';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ cookies }) => {
	// Din uppgift: Använd getUser för att få auth-status
	// (Inte requireAuth - det skulle redirecta på publika sidor!)

	const user = await getUser(cookies);

	return {
		user: user // Nu tillgängligt i alla komponenter via data.user
	};
};
