<script>
	import { enhance } from '$app/forms';

	export let form;

	let currentView = 'login';
	$: isLogin = currentView === 'login';
	$: action = isLogin ? '?/login' : '?/register';
	$: buttonText = isLogin ? 'Logga In' : 'Skapa Konto';
	$: doingText = isLogin ? 'Loggar in...' : 'Skapar konto...';

	let loading = false;
</script>

<main>
	<div class="form-container">
		<h1>{isLogin ? 'Logga In' : 'Skapa Konto'}</h1>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<label for="username">Användarnamn:</label>
			<input
				id="username"
				type="text"
				name="username"
				required
				placeholder="Skriv Användarnamn"
				autocomplete="off"
			/>

			<label for="email">Email:</label>
			<input
				id="email"
				type="email"
				name="email"
				required
				placeholder="Skriv Email"
				autocomplete="off"
			/>

			<label for="password">Lösenord:</label>
			<input
				id="password"
				type="password"
				name="password"
				required
				placeholder="Skriv Lösenord"
				autocomplete="off"
			/>

			<button type="submit" disabled={loading}>
				{loading ? doingText : buttonText}
			</button>
		</form>

		{#if form?.error}
			<div class="error">{form.error}</div>
		{/if}

		<div class="toggle-view">
			{#if isLogin}
				<p>Ny användare?</p>
				<button type="button" on:click={() => (currentView = 'signup')}>Skapa Konto</button>
			{:else}
				<p>Har redan ett konto?</p>
				<button type="button" on:click={() => (currentView = 'login')}>Logga in</button>
			{/if}
		</div>
	</div>
</main>

<style>
	main {
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}

	.form-container {
		background: #fff;
		padding: 3rem 3.5rem;
		border-radius: 20px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 400px;
		max-width: 90vw;
	}

	h1 {
		margin-bottom: 2rem;
		color: #2c3e50;
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
	}

	form {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	label {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.95rem;
	}

	input {
		padding: 0.85rem 1rem;
		margin-bottom: 0.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 10px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background-color: #f7fafc;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
		background-color: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	button[type='submit'] {
		margin-top: 1.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-weight: 700;
		font-size: 1.05rem;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	button[type='submit']:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
	}

	button[type='submit']:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.error {
		color: #e53e3e;
		margin-top: 1rem;
		text-align: center;
		background-color: #fff5f5;
		padding: 0.75rem;
		border-radius: 8px;
		border-left: 4px solid #e53e3e;
		font-weight: 500;
	}

	.toggle-view {
		margin-top: 2rem;
		text-align: center;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.toggle-view p {
		margin-bottom: 0.75rem;
		color: #718096;
		font-size: 0.95rem;
	}

	.toggle-view button {
		background: none;
		border: none;
		color: #667eea;
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	.toggle-view button:hover {
		color: #764ba2;
		text-decoration: underline;
	}
</style>
