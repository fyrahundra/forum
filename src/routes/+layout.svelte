<script>
	import favicon from '$lib/assets/favicon.svg';

	export let data; // Kommer från +layout.server.ts
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="main-nav">
	<div class="nav-left">
		<a href="/">Hem</a>
		<!-- Din uppgift: Visa olika navigation beroende på om användaren är inloggad -->
		{#if data.user}
			<a href="/dashboard">Dashboard</a>
			<a href="/profile">Profil</a>
		{/if}
	</div>

	<div class="nav-right">
		<!-- Din uppgift: Implementera conditional navigation -->
		{#if data.user}
			<span>Välkommen, {data.user.username}!</span>
			<!-- Logout-knapp som anropar logout action -->
			<form method="POST" action="login?/logout" style="display: inline;">
				<button type="submit">Logga ut</button>
			</form>
		{:else}
			<!-- Länk till login för ej inloggade -->
			<a href="/login">Logga In</a>
		{/if}
	</div>
</nav>

<main>
	<slot />
</main>

<style>
	.main-nav {
		display: flex;
		flex-direction: row;

		position: relative;

		margin-left: 2%;
		margin-right: 2%;
		margin-top: 1%;

		background-color: #aaa9a9;

		z-index: 1000;

		height: 5vh;
	}
	.nav-left {
		position: absolute;
		left: 0;
		top: 25%;
	}

	.nav-right {
		position: absolute;
		right: 0;
		top: 25%;
	}
</style>
