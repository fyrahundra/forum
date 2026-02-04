import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib';

export const GET: RequestHandler = async ({ url }) => {
	const forumId = url.searchParams.get('forumId');
	const page = Number(url.searchParams.get('page') ?? 1);
	const pageSize = 10;

	if (!forumId) {
		return json({ error: 'forumId is required' }, { status: 400 });
	}

	const messages = await prisma.message.findMany({
		where: {
			forumId: forumId
		},
		include: {
			images: true,
			user: {
				select: {
					id: true,
					username: true,
					profileImage: true
				}
			}
		},
		orderBy: { createdAt: 'desc' },
		skip: (page - 1) * pageSize,
		take: pageSize
	});

	return json({ messages, page });
};
