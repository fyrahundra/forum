import { prisma } from '$lib';
import { redirect } from '@sveltejs/kit';
import * as crypto from 'node:crypto';

// Din uppgift: Implementera denna funktion
export async function requireAuth(cookies: any) {
	// 1. Få userId från cookies
	const userId = cookies.get('userId');

	// 2. Om ingen cookie: redirect till login
	if (!userId) {
		// Hur gör du redirect?
		throw redirect(303, '/login');
	}

	// 3. Hitta användare i databas
	const user = await prisma.user.findUnique({
		where: { id: userId }
	});

	// 4. Om användare inte finns: rensa cookie och redirect
	if (!user) {
		// Hur tar du bort en cookie?
		cookies.delete('userId', { path: '/' });
		// Redirect till login
		throw redirect(303, '/login');
	}

	// 5. Returnera användaren
	return user;
}

// Bonus: Skapa en "optional auth" funktion
export async function getUser(cookies: any) {
	// Din uppgift: Som requireAuth men utan redirect
	// Returnera user eller null

	const userId = cookies.get('userId');

	if (!userId) {
		return null;
	}

	const user = await prisma.user.findUnique({
		where: { id: userId }
	});

	if (!user) {
		cookies.delete('userId', { path: '/' });
		return null;
	}

	return user;
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
