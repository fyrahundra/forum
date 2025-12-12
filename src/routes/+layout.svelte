<script>
	import { resolve } from '$app/paths';
	export let data; // from +layout.server.ts
</script>

<svelte:head></svelte:head>

<div class="layout">
	<nav class="main-nav">
		<div class="nav-left">
			<a href={resolve('/')}>Hem</a>
			{#if data.user}
				<a href={resolve('/forums')}>Forum</a>
				<a href={resolve('/profile')}>Profil</a>
			{/if}
		</div>

		<div class="nav-right">
			{#if data.user}
				<form method="POST" action="/logout" style="display: inline;">
					<button type="submit">Logga ut</button>
				</form>
			{:else}
				<a href={resolve('/login')}>Logga In</a>
			{/if}
		</div>
	</nav>

	<main>
		<slot />
	</main>
</div>

<style>
	.layout {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		box-sizing: border-box;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}

	.main-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		height: 70px;
		flex-shrink: 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.nav-left,
	.nav-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-left a,
	.nav-right a {
		color: white;
		text-decoration: none;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.3s ease;
		padding: 0.5rem 1rem;
		border-radius: 6px;
	}

	.nav-left a:hover,
	.nav-right a:hover {
		background-color: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
	}

	.nav-right button {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		cursor: pointer;
		font: inherit;
		color: white;
		font-weight: 600;
		padding: 0.5rem 1.2rem;
		border-radius: 6px;
		transition: all 0.3s ease;
	}

	.nav-right button:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		padding: 2rem;
		overflow: hidden;
	}
</style>
