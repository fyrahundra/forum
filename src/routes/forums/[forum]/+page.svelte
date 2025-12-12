<!-- src/routes/forums/[forum]/+page.svelte -->
<script>
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';

	export let data, form;

	$: liveMessages = data.messages;
	$: forumName = data.forum.name;

	let editingId = null;
	let previewUrl = '';
	let uploading = false;
	let images = [];
	let selectedFiles = [];
	let fileInput;

	function syncFileInput() {
		if (!fileInput) return;
		const dt = new DataTransfer();
		for (const f of selectedFiles) dt.items.add(f);
		fileInput.files = dt.files;
	}

	function handleFileSelect(event) {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const newPreviews = [];
		const newFiles = [];

		for (const file of files) {
			const url = URL.createObjectURL(file);
			newPreviews.push(url);
			newFiles.push(file);
		}

		images = [...images, ...newPreviews];
		selectedFiles = [...selectedFiles, ...newFiles];
		syncFileInput();
		previewUrl = newPreviews.at(-1) ?? previewUrl;
	}

	function removeImage(imageToRemove) {
		const index = images.indexOf(imageToRemove); // get index before filtering

		if (index > -1) {
			selectedFiles.splice(index, 1);
		}

		images = images.filter((img) => img !== imageToRemove);

		if (previewUrl === imageToRemove) {
			previewUrl = images.length > 0 ? images[0] : '';
		}

		syncFileInput();
	}

</script>

<div class="container">
	<header class="page-header">
		<h1>Forum: {forumName}</h1>
		<nav class="breadcrumb">
			<a href={resolve('/forums')}>Alla Forum</a> <span>/</span>
			{forumName}
		</nav>
	</header>

	<div class="content-wrapper">
		<section class="messages-section">
			<h2>Meddelanden ({liveMessages.length})</h2>
			<div class="messages-list">
				{#each liveMessages as message (message.id)}
					<div class="message" in:fly={{ y: 20 }}>
						{#if editingId === message.id}
							<form
								action="?/edit"
								method="POST"
								class="edit-form"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();
										if (result.type === 'success') {
											editingId = null;
											await invalidateAll();
										}
									};
								}}
							>
								<input type="hidden" name="id" value={message.id} />
								<textarea name="content" required>{message.content}</textarea>
								<div class="button-group">
									<button type="submit">Spara</button>
									<button type="button" on:click={() => (editingId = null)}>Avbryt</button>
								</div>
							</form>
						{:else}
							<div class="message-content">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								<p class="message-text" on:click={() => (editingId = message.id)}>
									{message.content}
								</p>
								{#if message.images && message.images.length > 0}
									<div class="message-images">
										{#each message.images as image, i (image.id)}
											<img
												src={`/uploads/${image.filename}`}
												alt={image.filename}
												class="message-image"
											/>
										{/each}
									</div>
								{/if}
								<div class="message-meta">
									<em>{message.author}</em>
									<span class="message-date">{message.createdAt.toLocaleString()}</span>
								</div>
							</div>
						{#if data.user.id === message.userId}
							<form action="?/delete" method="POST" class="delete-form" use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') {
										await invalidateAll();
									}
								};
							}}>
								<input type="hidden" name="id" value={message.id} />
								<button type="submit">Ta bort</button>
							</form>
						{/if}
						{/if}
					</div>
				{/each}
			</div>

			<nav class="pagination">
				{#if data.page > 1}
					<a href={resolve(`/forums/${data.forum.name}?page=${data.page - 1}`)}>Föregående</a>
				{:else}
					<span>Föregående</span>
				{/if}
				<span>Sida {data.page} av {data.totalPages}</span>
				{#if data.page < data.totalPages}
					<a href={resolve(`/forums/${data.forum.name}?page=${data.page + 1}`)}>Nästa</a>
				{:else}
					<span>Nästa</span>
				{/if}
			</nav>
		</section>

		<aside class="actions-section">
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<form
				method="POST"
				action="?/message"
				class="create-message-form"
				enctype="multipart/form-data"
				use:enhance={() => {
					uploading = true;
					return async ({ update }) => {
						uploading = false;
						images = [];
						selectedFiles = [];
						previewUrl = '';
						await update();
					};
				}}
			>
				<h3>Nytt meddelande</h3>

				<textarea name="content" required placeholder="Ditt meddelande..."
					>{form?.content ?? ''}</textarea
				>
				{#if previewUrl}
					<div style="overflow-x: auto; display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
						{#each images as image (image.filename)}
							<div style="position: relative;">
								<img src={image} alt="Preview" height="100" width="100" />
								<button class="image_button" on:click={() => removeImage(image)}>X</button>
							</div>
						{/each}
					</div>
				{/if}
				<input
					type="file"
					name="attachment"
					multiple
					accept="image/*"
					disabled={uploading}
					on:change={handleFileSelect}
					bind:this={fileInput}
				/>
				<button type="submit" disabled={uploading}
					>{uploading ? 'Skickar...' : 'Skicka'}</button
				>
			</form>

			<form method="GET" action="" class="search-form" use:enhance>
				<h3>Sök</h3>
				<input type="text" name="filter" placeholder="Sök meddelanden..." autocomplete="off" />
				<button type="submit">Sök</button>
			</form>
		</aside>
	</div>
</div>

<style>
	.container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: #2c3e50;
		padding: 2rem;
		box-sizing: border-box;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		overflow: hidden;
	}

	.page-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	h2 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		font-weight: 700;
		color: #2c3e50;
	}

	h3 {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		font-weight: 600;
		color: #2c3e50;
	}

	.breadcrumb {
		font-size: 0.9rem;
		color: #718096;
	}

	.breadcrumb a {
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.breadcrumb a:hover {
		color: #764ba2;
	}

	.breadcrumb span {
		margin: 0 0.5rem;
		color: #cbd5e0;
	}

	.content-wrapper {
		display: flex;
		gap: 1.5rem;
		width: 100%;
		max-width: 1200px;
		height: calc(100vh - 200px);
		overflow: hidden;
	}

	.messages-section {
		flex: 2;
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.actions-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
	}

	.image_button {
		z-index: 10;
		position: absolute;
		top: 0.20rem;
		right: 0.20rem;
		background: #e53e3e;
		border: none;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		cursor: pointer;
		font-size: 0.9rem;
		line-height: 18px;
		padding: 0;
	}

	.image_button:hover {
		background: #c53030;
	}

	.messages-list {
		flex: 1;
		overflow-y: auto;
		padding-right: 0.5rem;
		margin-bottom: 1rem;
	}

	.message {
		background: #fafafa;
		padding: 1rem;
		border-radius: 12px;
		margin-bottom: 1rem;
		border: 2px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		transition: all 0.2s ease;
	}

	.message:hover {
		border-color: #667eea;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
	}

	.message-content {
		flex: 1;
	}

	.message-text {
		background: white;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 2px solid transparent;
	}

	.message-text:hover {
		border-color: #667eea;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
	}

	.message-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: #718096;
		gap: 1rem;
	}

	.message-meta em {
		color: #667eea;
		font-weight: 600;
	}

	.message-date {
		color: #a0aec0;
		font-size: 0.8rem;
	}

	.edit-form {
		width: 100%;
	}

	.edit-form textarea {
		min-height: 80px;
		margin-bottom: 0.5rem;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
	}

	.button-group button {
		flex: 1;
		padding: 0.6rem;
		font-size: 0.9rem;
	}

	.delete-form button {
		background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
		box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.delete-form button:hover {
		box-shadow: 0 6px 20px rgba(229, 62, 62, 0.5);
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
		padding-top: 1rem;
		border-top: 2px solid #e2e8f0;
		margin-top: auto;
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
	}

	.pagination span {
		color: #a0aec0;
	}

	.error {
		color: #e53e3e;
		background-color: #fff5f5;
		padding: 0.75rem;
		border-radius: 8px;
		border-left: 4px solid #e53e3e;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.create-message-form,
	.search-form {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}

	textarea {
		width: 100%;
		padding: 0.85rem;
		border: 2px solid #e2e8f0;
		border-radius: 10px;
		font-size: 0.95rem;
		font-family: inherit;
		min-height: 100px;
		resize: vertical;
		box-sizing: border-box;
		background-color: #f7fafc;
		transition: all 0.3s ease;
		margin-bottom: 0.75rem;
	}

	textarea:focus {
		outline: none;
		border-color: #667eea;
		background-color: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input[type='text'] {
		width: 100%;
		padding: 0.85rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 10px;
		font-size: 0.95rem;
		box-sizing: border-box;
		background-color: #f7fafc;
		transition: all 0.3s ease;
		margin-bottom: 0.75rem;
	}

	input[type='text']:focus {
		outline: none;
		border-color: #667eea;
		background-color: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
	}

	button[type='submit'] {
		width: 100%;
	}

	button[type='button'] {
		background: #e2e8f0;
		color: #4a5568;
		box-shadow: none;
	}

	button[type='button']:hover {
		background: #cbd5e0;
		box-shadow: none;
	}

	.message-images {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		overflow-x: auto;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.message-image {
		width: 100px;
		height: 100px;
		object-fit: cover;
		border-radius: 8px;
		border: 2px solid #e2e8f0;
		transition: all 0.2s ease;
	}

	.message-image:hover {
		border-color: #667eea;
		transform: scale(1.05);
		cursor: pointer;
	}
</style>
