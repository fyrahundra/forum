<script lang="ts">
	import AuthenticatedLayout from '$lib/components/AuthenticatedLayout.svelte';
	import PublicLayout from '$lib/components/PublicLayout.svelte';
	export let data;
</script>

{#if data.user}
	<!-- Logged-in layout -->
	<AuthenticatedLayout {data}>
		<slot />
	</AuthenticatedLayout>
{:else}
	<!-- Public layout -->
	<PublicLayout {data}>
		<slot />
	</PublicLayout>
{/if}
