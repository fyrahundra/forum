import { json } from '@sveltejs/kit';
import { prisma } from '$lib';
// Din kod här
// Tips: Returnera bara antalet forum, eller senaste uppdateringstid
export async function GET() {
	const forums = await prisma.forum.findMany({
		include: { _count: { select: { messages: true } } }
	});
	return json({ forums });
}
