// src/lib/sessionCleanup.ts

import { prisma } from '$lib';
import cron from 'node-cron';

export async function cleanupExpiredSessions() {
	const deleted = await prisma.session.deleteMany({
		where: {
			expiresAt: { lt: new Date() }
		}
	});

	console.log(`Cleaned up ${deleted.count} expired sessions`);
}

// Kör dagligen (i en riktig app, använd cron job)
if (typeof window === 'undefined') {
	cron.schedule('0 0 * * *', cleanupExpiredSessions);
}
