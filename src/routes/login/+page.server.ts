import type { Actions } from '@sveltejs/kit';
import { prisma } from '$lib';
import { error, fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	register: async ({ request, cookies }) => {
		// Din uppgift: Få data från formuläret
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		// Din uppgift: Validering - vad ska du kolla?
		if (!username || username === undefined) {
			return fail(400, { error: 'Användarnamn krävs' });
		}
		if (!email || email === undefined) {
			return fail(400, { error: 'Email krävs' });
		}
		if (!password || password === undefined) {
			return fail(400, { error: 'Lösenord krävs' });
		}

		// Lägg till fler valideringar:
		// - Password för kort?
		// - Username för kort?
		// - Ogiltiga tecken?

		// Din uppgift: Kolla om användaren redan finns
		const existingUser = await prisma.user.findUnique({
			where: {
				username: username,
				email: email
			}
		});

		if (existingUser) {
			// Vad ska hända? Returnera fail() med lämpligt meddelande
			return fail(400, { error: 'Kontot finns redan' });
		}

		// Din uppgift: Skapa användare
		// VARNING: Detta sparar lösenord i klartext (osäkert!)
		// Vi kommer fixa detta i senare modul
		try {
			const newUser = await prisma.user.create({
				data: {
					username: username,
					email: email,
					password: password
				}
			});

			// Din uppgift: Logga in användaren direkt
			// För nu: spara user ID i cookie (enkelt men inte säkrast)
			cookies.set('userId', newUser.id, {
				path: '/',
				maxAge: 604800,
				secure: false, // true i production
				httpOnly: true
			});
			throw redirect(303, '/forums');
		} catch (error) {
			if (
				error &&
				((error.status && error.status >= 300 && error.status < 400) || error.name === 'Redirect')
			) {
				console.log('[register] rethrowing redirect:', error);
				throw error;
			}
			// Vad kan gå fel här? Hur hanterar du det?
			return fail(500, { message: 'Kunde Inte Skapa Användare' });
		}
		// Vart ska användaren skickas efter registrering?
	},

	login: async ({ request, cookies }) => {
		// Din uppgift: Implementera login-logiken
		// 1. Få username och password från formData
		// 2. Hitta användare i databas
		// 3. Jämför lösenord (för nu: direkt jämförelse)
		// 4. Om korrekt: sätt cookie och redirect
		// 5. Om fel: returnera error

		// Din implementation här:

		const data = await request.formData();
		const username = data.get('username')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!username || username === undefined) {
			return fail(400, { error: 'Användarnamn krävs' });
		}
		if (!email || email === undefined) {
			return fail(400, { error: 'Email krävs' });
		}
		if (!password || password === undefined) {
			return fail(400, { error: 'Lösenord krävs' });
		}

		try {
			const user = await prisma.user.findUnique({
				where: { username: username, email: email }
			});

			if (user.password === password) {
				cookies.set('userId', user.id, {
					path: '/',
					maxAge: 604800,
					secure: false, // true i production
					httpOnly: true
				});
				throw redirect(303, '/forums');
			}
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
