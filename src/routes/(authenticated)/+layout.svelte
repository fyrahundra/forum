<script>
	export let data;
	import AuthenticatedLayout from '$lib/components/AuthenticatedLayout.svelte';
</script>

<AuthenticatedLayout {data}>
	<slot />
</AuthenticatedLayout>
