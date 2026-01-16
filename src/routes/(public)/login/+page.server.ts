import type { Actions } from '@sveltejs/kit';
import { prisma } from '$lib';
import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, validatePassword } from '$lib/auth';

function validatePasswordStrength(password: string, email: string, username: string): string[] {
	const errors: string[] = [];
	if (password.length < 6) {
		errors.push('Lösenord måste vara minst 6 tecken långt.');
	}
	if (!/[A-Z]/.test(password)) {
		errors.push('Lösenord måste innehålla minst en stor bokstav.');
	}
	if (!/[a-z]/.test(password)) {
		errors.push('Lösenord måste innehålla minst en liten bokstav.');
	}
	if (!/[0-9]/.test(password)) {
		errors.push('Lösenord måste innehålla minst en siffra.');
	}
	if (!/[\W_]/.test(password)) {
		errors.push('Lösenord måste innehålla minst ett specialtecken.');
	}
	if (email && password.toLowerCase().includes(email.toLowerCase())) {
		errors.push('Lösenord får inte innehålla din e-postadress.');
	}
	if (username && password.toLowerCase().includes(username.toLowerCase())) {
		errors.push('Lösenord får inte innehålla ditt användarnamn.');
	}

	const commonPasswords = [
		'password',
		'123456',
		'qwerty',
		'letmein',
		'welcome',
		'abc123',
		'password123'
	];
	if (commonPasswords.includes(password.toLowerCase())) {
		errors.push('Lösenord är för vanligt. Välj ett starkare lösenord.');
	}

	return errors;
}

const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export const actions: Actions = {
	register: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		// Validering
		if (!username || !password) {
			return fail(400, { error: 'Användarnamn och lösenord krävs' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Användarnamn måste vara minst 3 tecken' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Lösenord måste vara minst 6 tecken' });
		}

		const passwordErrors = validatePasswordStrength(password, email, username);
		if (passwordErrors.length > 0) {
			return fail(400, { error: passwordErrors.join('. ') });
		}

		// Kontrollera om användaren redan finns
		const existingUser = await prisma.user.findUnique({
			where: { email: email }
		});

		if (existingUser) {
			return fail(400, { error: 'E-postadressen är redan tagen' });
		}

		// Hasha lösenordet säkert
		const { salt, hash } = hashPassword(password);

		// Skapa användare med säker lagring
		const newUser = await prisma.user.create({
			data: {
				username,
				email,
				salt: salt,
				hash: hash
			}
		});

		// Logga in användaren
		cookies.set('userId', newUser.id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 7,
			secure: false, // true i production
			httpOnly: true
		});

		throw redirect(307, '/forums');
	},

	login: async ({ request, cookies, getClientAddress }) => {
		// Din uppgift: Implementera login-logiken
		// 1. Få username och password från formData
		// 2. Hitta användare i databas
		// 3. Jämför lösenord (för nu: direkt jämförelse)
		// 4. Om korrekt: sätt cookie och redirect
		// 5. Om fel: returnera error

		// Din implementation här:

		const clientIP = getClientAddress();

		const attempts = failedAttempts.get(clientIP);

		if (attempts && attempts.count >= 5) {
			const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
			if (timeSinceLastAttempt < 15 * 60 * 1000) {
				return fail(429, {
					message: 'För många misslyckade inloggningsförsök. Vänta 15 minuter och försök igen.'
				});
			} else {
				failedAttempts.delete(clientIP);
			}
		}

		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!password || !email) {
			return fail(400, { error: 'Lösenord och email krävs' });
		}

		try {
			const user = await prisma.user.findUnique({
				where: { email: email }
			});

			const dummySalt = 'dummysalt123456789abcdef123456789abcdef';
			const dummyHash = 'dummyhash123456789abcdef123456789abcdef123456789abcdef123456789abcdef';

			const isValidatePassword = user
				? validatePassword(password, user.salt, user.hash)
				: validatePassword(password, dummySalt, dummyHash);

			if (!user || !isValidatePassword) {
				const current = failedAttempts.get(clientIP) || { count: 0, lastAttempt: new Date() };
				failedAttempts.set(clientIP, {
					count: current.count + 1,
					lastAttempt: new Date()
				});
				return fail(400, { message: 'Ogiltig email eller lösenord' });
			} else {
				failedAttempts.delete(clientIP);
			}

			cookies.set('userId', user.id, {
				path: '/',
				maxAge: 604800,
				secure: false, // true i production
				httpOnly: true
			});
			throw redirect(307, '/forums');
		} catch (error) {
			if (
				error &&
				((error.status && error.status >= 300 && error.status < 400) || error.name === 'Redirect')
			) {
				console.log('[login] rethrowing redirect:', error);
				throw error;
			}
			// Vad kan gå fel här? Hur hanterar du det?
			return fail(500, { message: 'Kunde Inte Logga In' });
		}
	},

	logout: async ({ cookies }) => {
		cookies.delete('userId', { path: '/' });
		throw redirect(303, '/');
	}
};
