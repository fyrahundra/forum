<!-- src/routes/forums/+page.svelte -->
<script>
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';

	export let data, form;

	$: liveData = data.forums;

	let editingID = null;
</script>

<div class="container">
	<h1>Forum ({liveData.length} totalt)</h1>

	{#if form?.error}
		<p>{form.error}</p>
	{/if}

	<section class="forums-overview">
		<div>
			<section class="forums-list" in:fly={{ y: 20 }}>
				<p>{liveData.length === 0 ? 'Inga forum tillgängliga. Skapa ett nytt forum!' : ''}</p>
				{#each liveData as forum (forum.id)}
					<!-- Länka till varje forum -->
					<a href={resolve(`/forums/${forum.name}`)}>Forum: {forum.name}</a>
					{#if forum.id === editingID}
						<form
							action="?/edit"
							method="POST"
							style="display: flex; flex-direction: column;"
							use:enhance
						>
							<input type="hidden" name="id" value={forum.id} />
							<textarea
								name="description"
								placeholder="Ny beskrivning..."
								autocomplete="off"
								required>{forum.description}</textarea
							>
							<button type="submit" style="cursor: pointer;">Spara ändringar</button>
							<button type="button" onclick={() => (editingID = null)}>Avbryt</button>
						</form>
					{:else}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<p onclick={() => (editingID = forum.id)} style="font-size: 0.9em;">
							{#if forum.description}Beskrivning: {forum.description}
							{:else}Ingen beskrivning tillgänglig{/if}
							<br />
							{#if forum._count.messages === 1}
								{`(${forum._count.messages} meddelande)`}
							{:else}
								{forum._count.messages > 1 ? `(${forum._count.messages} meddelanden)` : ''}
							{/if}
						</p>
					{/if}

					{#if editingID === null}
						<form action="?/delete" method="POST" use:enhance>
							<input type="hidden" name="id" value={forum.id} />
							{console.log(forum.id)}
							<button type="submit" style="cursor: pointer;">Ta bort</button>
						</form>
					{/if}

					<hr style="width: 100%;" />
				{/each}
			</section>
			<nav style="display: flex; width: 100%; justify-content: space-between;">
				{#if data.page > 1}
					<a href={resolve(`/forums?page=${data.page - 1}`)}>Föregående</a>
				{:else}
					<span>Föregående</span>
				{/if}
				<span> Sida {data.page} av {data.totalPages} </span>
				{#if data.page < data.totalPages}
					<a href={resolve(`/forums?page=${data.page + 1}`)}>Nästa</a>
				{:else}
					<span>Nästa</span>
				{/if}
			</nav>
		</div>

		<hr />
		{#if data.user}
			<!-- Form för att skapa nytt forum -->
			<form method="POST" action="?/create" use:enhance>
				<!-- Lägg till input-fält här -->
				<div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px;">
					<h2>Skapa nytt forum</h2>
					<input
						type="text"
						name="name"
						placeholder="Forum-namn..."
						autocomplete="off"
						value={form?.name ?? ''}
						required
					/>
					<textarea name="description" placeholder="Beskrivning..." autocomplete="off" required
						>{form?.description ?? ''}</textarea
					>
					<input type="hidden" name="userId" value={data.user?.id} />
					<button type="submit">Skapa forum</button>
				</div>
			</form>
		{/if}
	</section>
</div>

<style>
	.container {
		width: 100vw;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 20px;
		align-items: center;
		font-family: 'Arial', sans-serif;
		color: #2c3e50;
		padding: 20px;
		box-sizing: border-box;
	}
	.forums-list {
		min-width: 50vw;
		max-width: 50vw;
		max-height: 40vh;
		min-height: 40vh;
		overflow-y: scroll;
		max-width: 300px;
		text-align: center;

		display: flex;
		flex-direction: column;
	}

	.forums-overview {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}
</style>
