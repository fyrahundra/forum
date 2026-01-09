// src/routes/api/request-reset/+server.ts
import { prisma } from '$lib';
import { Resend } from 'resend';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { json } from '@sveltejs/kit';
import { RESEND_API_KEY } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export async function POST({ request, url }) {
	const { email } = await request.json();

	const user = await prisma.user.findUnique({ where: { email } });

	// Always return success (prevent email enumeration)
	if (!user) return json({ ok: true });

	const rawToken = crypto.randomBytes(32).toString('hex');
	const tokenHash = await bcrypt.hash(rawToken, 10);

	await prisma.passwordResetToken.create({
		data: {
			userId: user.id,
			tokenHash,
			expiresAt: new Date(Date.now() + 1000 * 60 * 15) // 15 min
		}
	});

	// Use url.origin for dynamic base URL
	const resetUrl = `${url.origin}/reset?token=${rawToken}`;

	try {
		const emailResult = await resend.emails.send({
			from: 'Auth <onboarding@resend.dev>',
			to: user.email,
			subject: 'Reset your password',
			html: `<p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link expires in 15 minutes.</p>`
		});
		console.log('Email sent:', emailResult);
	} catch (e) {
		console.error('Failed to send email:', e);
	}

	return json({ ok: true });
}
