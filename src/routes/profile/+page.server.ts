import type { ServerLoad } from '@sveltejs/kit';
import { getUser } from '$lib/auth';

export const load: ServerLoad = async ({ cookies }) => {
    let user = await getUser(cookies);
    return { user };
};