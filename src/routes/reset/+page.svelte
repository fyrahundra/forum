<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let token = '';
	let newPassword = '';
	let confirmPassword = '';
	let message = '';
	let error = '';

	// Grab token from URL
	$: token = $page.url.searchParams.get('token') || '';

	function validatePasswordStrength(password): string[] {
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

	async function submitNewPassword() {
		message = '';
		error = '';

		if (!token) {
			error = 'Invalid or missing token.';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		const passwordErrors = validatePasswordStrength(newPassword);
		if (passwordErrors.length > 0) {
			error = passwordErrors.join('. ');
			return;
		}

		try {
			const res = await fetch('/api/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, newPassword })
			});

			const data = await res.json();
			if (data.ok) {
				message = 'Password successfully reset! You can now log in.';
				setTimeout(() => {
					goto(resolve('/login'));
				}, 2000);
			} else {
				error = data.error || 'Failed to reset password.';
			}
		} catch {
			error = 'Network error';
		}
	}
</script>

<form on:submit|preventDefault={submitNewPassword}>
	<input type="password" bind:value={newPassword} placeholder="New password" required />
	<input type="password" bind:value={confirmPassword} placeholder="Confirm password" required />
	<button type="submit">Reset Password</button>
</form>

{#if message}
	<p style="color:green">{message}</p>
{/if}

{#if error}
	<p style="color:red">{error}</p>
{/if}
