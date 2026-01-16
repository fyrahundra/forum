<script>
	export let data;
	import PublicLayout from '$lib/components/PublicLayout.svelte';
</script>

<PublicLayout {data}>
	<slot />
</PublicLayout>
