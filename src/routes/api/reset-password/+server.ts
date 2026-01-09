// src/routes/api/reset-password/+server.ts
import { prisma } from '$lib';
import bcrypt from 'bcryptjs';
import { json } from '@sveltejs/kit';
import { hashPassword } from '$lib/auth';

export async function POST({ request }) {
	const { token, newPassword } = await request.json();

	if (!token || !newPassword) return json({ ok: false, error: 'Missing fields' });

	const tokens = await prisma.passwordResetToken.findMany({
		where: {
			expiresAt: { gte: new Date() }
		}
	});

	// Find matching token
	const matchingToken = tokens.find((t) => bcrypt.compareSync(token, t.tokenHash));
	if (!matchingToken) return json({ ok: false, error: 'Invalid or expired token' });

	const userId = matchingToken.userId;

	// Use hashPassword from $lib/auth - uses pbkdf2, NOT bcrypt
	const { salt, hash } = hashPassword(newPassword);

	await prisma.user.update({
		where: { id: userId },
		data: { hash: hash, salt: salt }
	});

	// Delete token after use
	await prisma.passwordResetToken.delete({ where: { id: matchingToken.id } });

	return json({ ok: true });
}
