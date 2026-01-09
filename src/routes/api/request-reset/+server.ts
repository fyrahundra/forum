// src/routes/api/request-reset/+server.ts
import { prisma } from '$lib';
import { Resend } from 'resend';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { json } from '@sveltejs/kit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST({ request }) {
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
      expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 min
    },
  });

  let resetUrl = '';
  
  if (process.env.NODE_ENV === 'development') {
    resetUrl = `http://localhost:4173/reset?token=${rawToken}`;
  }
  else {
    resetUrl = `https://forum-ewm9.onrender.com/reset?token=${rawToken}`;
  }

  try { 
    const emailResult = await resend.emails.send({
      from: 'Auth <onboarding@resend.dev>',
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link expires in 15 minutes.</p>`,
    });
    console.log('Email sent:', emailResult);
  } catch (e) {
    console.error('Failed to send email:', e);
  }

  return json({ ok: true });
}
