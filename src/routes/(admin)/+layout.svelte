<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	export let data;
	import { navigating } from '$app/stores';
</script>

{#if $navigating}
	<div class="loading-overlay">
		<div class="spinner">Loading...</div>
	</div>
{/if}

<div id="admin-layout">
	<header>
		<button
			onclick={() => {
				goto(resolve('/forums'));
			}}>←</button
		>
		<h1>Admin Dashboard</h1>
	</header>

	<main>
		<slot />
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
	}

	header {
		padding: 1rem 2rem;
		color: white;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	header h1 {
		margin: 0;
		font-size: 1.8rem;
		border-bottom: solid 0.1rem white;
	}

	main {
		padding: 2rem;
	}

	.loading-overlay {
		position: fixed;
		inset: 0;
		background: rgba(255, 255, 255, 0.7);
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
