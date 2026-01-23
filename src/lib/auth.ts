import { prisma } from '$lib';
import { redirect } from '@sveltejs/kit';
import * as crypto from 'node:crypto';

export function generateSessionToken(): string {
	// Din uppgift: Skapa en säker, unik token
	// Tips: 32 bytes = 256 bits är bra säkerhet
	// Använd base64url för URL-safe tokens
	return crypto.randomBytes(32).toString('base64url');
}

export async function createSession(
	userId: string,
	userAgent?: string,
	ipAddress?: string,
	maxAgeInDays: number = 14
) {
	const token = generateSessionToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + maxAgeInDays); // maxAgeInDays dagar

	const session = await prisma.session.create({
		data: {
			token,
			user: {
				connect: { id: userId }
			},
			userAgent,
			ipAddress,
			expiresAt,
			lastUsed: new Date(),
			deviceName: userAgent?.split('/')[0] || 'Unknown'
		}
	});

	return session;
}

export function isTokenExpired(createdAt: Date, maxAgeInDays: number = 14): boolean {
	// Din uppgift: Kontrollera om token är för gammal
	// Beräkna tidsskillnad i millisekunder
	// Jämför med max age
	const now = new Date();
	const ageInMs = now.getTime() - createdAt.getTime();
	const maxAgeInMs = maxAgeInDays * 24 * 60 * 60 * 1000;

	return ageInMs > maxAgeInMs;
}

export async function validateSession(token: string) {
	const session = await prisma.session.findUnique({
		where: { token },
		include: { user: true }
	});

	if (!session) {
		return null;
	}

	// Kontrollera expiration
	if (session.expiresAt < new Date()) {
		// Cleanup expired session
		await prisma.session.delete({ where: { id: session.id } });
		return null;
	}

	// Uppdatera last used
	await prisma.session.update({
		where: { id: session.id },
		data: { lastUsed: new Date() }
	});

	return session;
}

export async function detectSuspiciousActivity(userId: string) {
	const sessions = await prisma.session.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' }
	});

	// Kontrollera för ovanliga patterns
	const ipAddresses = new Set(sessions.map((s) => s.ipAddress));
	const recentSessions = sessions.filter(
		(s) => s.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
	);

	// Alerts för:
	// - För många IP-adresser
	if (ipAddresses.size > 5) {
		console.warn(`User ${userId} has sessions from ${ipAddresses.size} different IPs`);
	}
	// - För många nya sessions
	if (recentSessions.length > 10) {
		console.warn(`User ${userId} created ${recentSessions.length} sessions in 24h`);
	}
	// - Sessions från olika länder
	const countries = new Set<string>();
	for (const session of sessions) {
		const country = await getCuntrtyFromIP(session.ipAddress);
		if (country) {
			countries.add(country);
		}
	}
	if (countries.size > 3) {
		console.warn(`User ${userId} has sessions from ${countries.size} different countries`);
	}
}

export async function getCuntrtyFromIP(ipAddress: string): Promise<string | null> {
	if (!ipAddress) return null;

	try {
		const response = await fetch(`https://ipapi.co/${ipAddress}/country/`);
		if (response.ok) {
			const countryCode = await response.text();
			return countryCode;
		}
		return null;
	} catch (error) {
		console.error('Error fetching country from IP:', error);
		return null;
	}
}

// Din uppgift: Implementera denna funktion
export async function requireAuth(cookies: any) {
	// 1. Få userId från cookies
	const sessionToken = cookies.get('sessionToken');

	if (!sessionToken) {
		throw redirect(303, '/login');
	}

	const session = await prisma.session.findUnique({
		where: { token: sessionToken },
		include: { user: true }
	});

	if (!session || !session.createdAt) {
		cookies.delete('sessionToken', { path: '/' });
		throw redirect(303, '/login');
	}

	const expiredDays = 14;
	if (isTokenExpired(session.createdAt, expiredDays)) {
		await prisma.session.delete({
			where: { token: sessionToken }
		});
		cookies.delete('sessionToken', { path: '/' });
		throw redirect(303, '/login');
	}

	// Uppdatera lastUsed
	await prisma.session.update({
		where: { token: sessionToken },
		data: { lastUsed: new Date() }
	});

	// 5. Returnera användaren
	return session.user;
}

// Bonus: Skapa en "optional auth" funktion
export async function getUser(cookies: any) {
	// Din uppgift: Som requireAuth men utan redirect
	// Returnera user eller null

	const sessionToken = cookies.get('sessionToken');

	if (!sessionToken) {
		return null;
	}

	const user = await prisma.session.findUnique({
		where: { token: sessionToken },
		include: { user: true }
	});

	if (!user) {
		cookies.delete('sessionToken', { path: '/' });
		return null;
	}

	return user.user;
}

// Function to generate a new salt and hash a password
export function hashPassword(password: string): { salt: string; hash: string } {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
	return { salt, hash };
}

// Function to validate a password against a stored salt and hash
export function validatePassword(
	inputPassword: string,
	storedSalt: string,
	storedHash: string
): boolean {
	const hash = crypto.pbkdf2Sync(inputPassword, storedSalt, 10000, 64, 'sha512').toString('hex');
	return storedHash === hash;
}
