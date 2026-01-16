<script>
	import { navigating } from '$app/stores';

	export let data; // from +layout.server.ts
</script>

<svelte:head>
	<title>Forum App</title>
	<meta name="description" content="Reset your password" />
</svelte:head>

{#if $navigating}
	<div class="loading-overlay">
		<div class="spinner">Loading...</div>
	</div>
{/if}

<div id="app">
	<slot />
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		overflow-x: hidden;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;

		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.spinner {
		font-size: 1.5rem;
		color: #333;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
