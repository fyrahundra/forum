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

<main class="column">
	<form
		method="POST"
		{action}
		use:enhance={() => {
			// Din uppgift: Vad ska hända när form submits?
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
	>
		<div class="column">
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
		</div>
	</form>

	<!-- Visa fel-meddelanden om de finns -->
	{#if form?.error}
		<div class="error">
			<!-- Hur visar du felmeddelandet? -->
			{form.error}
		</div>
	{/if}

	{#if currentView === 'login'}
		<h2>Ny användare?</h2>
		<button type="button" on:click={() => (currentView = 'signup')}>Skapa Konto</button>
	{/if}
	{#if currentView === 'signup'}
		<h2>Har Redan Ett?</h2>
		<button type="button" on:click={() => (currentView = 'login')}>Logga in</button>
	{/if}
</main>

<style>
	/* Din uppgift: Lägg till styling */
	/* Tips: formulär behöver struktur och spacing */

	.column {
		display: flex;
		flex-direction: column;
	}
	main {
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
