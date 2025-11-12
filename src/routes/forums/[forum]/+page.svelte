<!-- src/routes/forums/[forum]/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import { writable } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { wsClient, wsConnected, wsForums, wsMessages } from '$lib/websocket-client.js';
	import { onDestroy, onMount } from 'svelte';

	export let data, form;

	$: liveMessages = $wsMessages ?? data.messages;
	let forumName = data.forum.name;

	console.log(liveMessages);

	onMount(() => {
		wsClient.connect();
	});

	onDestroy(() => {
		wsClient.disconnect();
	});

	let editingId = null;
</script>

<!-- Breadcrumb navigation -->

<div class="container">
	<h1>Forum: {forumName}</h1>

	<nav>
		<a href="/forums">Alla Forum</a> | {forumName}
	</nav>

	<article>
		<section
			style="overflow-y: scroll; height: 60vh; width: 100%; min-width: 600px; max-width: 600px; border: 1px solid #ccc; padding: 10px; box-sizing: border-box;"
		>
			<!-- Lista meddelanden -->
			<h2>Meddelanden ({liveMessages.length})</h2>
			{#each liveMessages as message}
				<div class="message" in:fly={{ y: 20 }}>
					<!-- Visa meddelande här -->
					<div
						style="display: flex; gap: 10px; flex-direction: row; margin-top: 10px; align-items: center; justify-content: space-between;"
					>
						{#if editingId === message.id}
							<form
								action="?/edit"
								method="POST"
								style="display: flex; flex-direction:column;"
								use:enhance
							>
								<input type="hidden" name="id" value={message.id} />
								<textarea name="content" required>{message.content}</textarea>
								<button type="submit">Spara ändringar</button>
								<button type="button" onclick={() => (editingId = null)}>Avbryt</button>
							</form>
						{:else}
							<div>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								<p onclick={() => (editingId = message.id)}>
									{message.content} - <em>{message.author}</em> <br />
									<br />{message.createdAt.toLocaleString()}
								</p>
							</div>
						{/if}
						<form action="?/delete" method="POST" use:enhance>
							<input type="hidden" name="id" value={message.id} />
							<button type="submit" style="cursor: pointer;">Ta bort</button>
						</form>
					</div>
				</div>
				<hr />
			{/each}
		</section>

		<nav style="display: flex; justify-content: space-between;">
			{#if data.page > 1}
				<a href="?page={data.page - 1}">Föregående</a>
			{:else}
				<span>Föregående</span>
			{/if}
			<span> Sida {data.page} av {data.totalPages} </span>

			{#if data.page < data.totalPages}
				<a href="?page={data.page + 1}">Nästa</a>
			{:else}
				<span>Nästa</span>
			{/if}
		</nav>

		{#if form?.error}
			<p>{form.error}</p>
		{/if}
		<!-- Form för nytt meddelande -->
		<form
			method="POST"
			action="?/message"
			onsubmit={() => console.log('Form submitted', liveData)}
			use:enhance
		>
			<!-- Lägg till input-fält för meddelande här -->
			<div style="display: flex; flex-direction: column; margin-bottom: 10px; margin-top: 10px;">
				<textarea name="content" id="" required placeholder="Ditt meddelande..."
					>{form?.content ?? ''}</textarea
				>
			</div>
			<div style="display: flex; justify-content: center;">
				<button type="submit">Skicka</button>
			</div>
		</form>
		<form method="GET" action="" use:enhance>
			<input type="text" name="filter" placeholder="Sök meddelanden..." autocomplete="off" />
			<button type="submit">Sök</button>
		</form>
	</article>
</div>

<style>
	.container {
		width: 100vw;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-family: 'Arial', sans-serif;
		color: #2c3e50;
		padding: 20px;
		box-sizing: border-box;
	}
</style>
