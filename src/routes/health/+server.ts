import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib';

export const GET: RequestHandler = async () => {
	try {
		await prisma.$queryRaw`SELECT 1`; // Simple query to check DB connectivity

		return new Response(
			JSON.stringify({
				status: 'ok',
				timestamp: new Date().toISOString(),
				uptime: process.uptime()
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		return new Response(
			JSON.stringify({
				status: 'error',
				message: String(err),
				timestamp: new Date().toISOString(),
				uptime: process.uptime()
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}
