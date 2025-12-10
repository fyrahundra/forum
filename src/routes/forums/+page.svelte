<script>
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';

	export let data, form;
	$: liveData = data.forums;

	let editingID = null;
</script>

<div class="page-container">
	<main class="main-content">
		<!-- Left: Forum list -->
		<section class="forums-section">
			<h1>Forum ({liveData.length})</h1>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<div class="forums-list" in:fly={{ y: 20 }}>
				{#if liveData.length === 0}
					<p>Inga forum tillgängliga. Skapa ett nytt forum!</p>
				{/if}

				{#each liveData as forum (forum.id)}
					<div class="forum-item">
						<a class="forum-link" href={resolve(`/forums/${forum.name}`)}>
							Forum: {forum.name}
						</a>

						{#if forum.id === editingID}
							<form action="?/edit" method="POST" class="edit-form" use:enhance>
								<input type="hidden" name="id" value={forum.id} />
								<textarea name="description" placeholder="Ny beskrivning..." required>{forum.description}</textarea>
								<div class="button-group">
									<button type="submit">Spara ändringar</button>
									<button type="button" on:click={() => (editingID = null)}>Avbryt</button>
								</div>
							</form>
						{:else}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<p class="forum-desc" on:click={() => (editingID = forum.id)}>
								{forum.description ? `Beskrivning: ${forum.description}` : 'Ingen beskrivning tillgänglig'}
								<br />
								{forum._count.messages === 1
									? `(1 meddelande)`
									: forum._count.messages > 1
									? `(${forum._count.messages} meddelanden)`
									: ''}
							</p>
						{/if}

						{#if editingID === null}
							<form action="?/delete" method="POST" use:enhance class="delete-form">
								<input type="hidden" name="id" value={forum.id} />
								<button type="submit">Ta bort</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>

			<nav class="pagination">
				{#if data.page > 1}
					<a href={resolve(`/forums?page=${data.page - 1}`)}>Föregående</a>
				{:else}
					<span>Föregående</span>
				{/if}
				<span>Sida {data.page} av {data.totalPages}</span>
				{#if data.page < data.totalPages}
					<a href={resolve(`/forums?page=${data.page + 1}`)}>Nästa</a>
				{:else}
					<span>Nästa</span>
				{/if}
			</nav>
		</section>

		<!-- Right: Create forum -->
		{#if data.user}
			<section class="create-section">
				<form method="POST" action="?/create" use:enhance class="create-form">
					<h2>Skapa nytt forum</h2>
					<input
						type="text"
						name="name"
						placeholder="Forum-namn..."
						value={form?.name ?? ''}
						required
					/>
					<textarea
						name="description"
						placeholder="Beskrivning..."
						required
					>{form?.description ?? ''}</textarea>
					<input type="hidden" name="userId" value={data.user?.id} />
					<button type="submit">Skapa forum</button>
				</form>
			</section>
		{/if}
	</main>
</div>

<style>
	.page-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: #2c3e50;
		overflow: hidden;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.main-content {
		display: flex;
		flex: 1;
		gap: 2rem;
		padding: 2rem;
		box-sizing: border-box;
		overflow: hidden;
	}

	.forums-section {
		flex: 2;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.1);
	}

	.create-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.1);
	}

	h1 {
		margin-bottom: 1.5rem;
		font-size: 2rem;
		font-weight: 700;
		color: #2c3e50;
	}

	h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: #2c3e50;
	}

	.error {
		color: #e53e3e;
		margin-bottom: 1rem;
		background-color: #fff5f5;
		padding: 0.75rem;
		border-radius: 8px;
		border-left: 4px solid #e53e3e;
	}

	.forums-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.forum-item {
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		background: #fafafa;
		transition: all 0.3s ease;
	}

	.forum-item:hover {
		border-color: #667eea;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
		transform: translateY(-2px);
	}

	.forum-link {
		font-weight: 700;
		font-size: 1.1rem;
		color: #667eea;
		text-decoration: none;
		margin-bottom: 0.5rem;
		transition: color 0.2s ease;
	}

	.forum-link:hover {
		color: #764ba2;
	}

	.forum-desc {
		font-size: 0.95rem;
		cursor: pointer;
		color: #718096;
		line-height: 1.6;
		margin-top: 0.5rem;
	}

	.edit-form,
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	input[type='text'],
	textarea {
		padding: 0.85rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 10px;
		font-size: 1rem;
		width: 100%;
		box-sizing: border-box;
		background-color: #f7fafc;
		transition: all 0.3s ease;
		font-family: inherit;
	}

	input[type='text']:focus,
	textarea:focus {
		outline: none;
		border-color: #667eea;
		background-color: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.button-group {
		display: flex;
		gap: 0.75rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		width: 100%;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
	}

	.button-group button {
		width: auto;
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
	}

	.delete-form button {
		background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
		width: 100%;
		margin-top: 0.75rem;
		box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
	}

	.delete-form button:hover {
		box-shadow: 0 6px 20px rgba(229, 62, 62, 0.5);
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 2px solid #e2e8f0;
		font-weight: 500;
	}

	.pagination a {
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.pagination a:hover {
		background-color: rgba(102, 126, 234, 0.1);
		color: #764ba2;
	}

	.pagination span {
		color: #a0aec0;
	}
</style>
