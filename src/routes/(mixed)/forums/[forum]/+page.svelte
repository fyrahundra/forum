<!-- src/routes/forums/[forum]/+page.svelte -->
<script>
	import { resolve } from '$app/paths';
	import { applyAction, enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { browser } from '$app/environment';

	export let data, form;

	let messages = [...data.messages];
	let loadedPages = new SvelteSet([data.page]);
	let currentMinPage = data.page;
	let currentMaxPage = data.page;
	let isLoadingTop = false;
	let isLoadingBottom = false;
	let topSentinel;
	let bottomSentinel;

	let connectionStatus = 'Connecting';
	let connectionAtempts = 0;
	let maxConnectionAttempts = 5;

	// Update messages from data when forum or page changes
	let lastForumId = data.forum.id;

	$: if (data.forum.id !== lastForumId) {
		lastForumId = data.forum.id;
		messages = [...data.messages];
		loadedPages = new SvelteSet([data.page]);
		currentMinPage = data.page;
		currentMaxPage = data.page;
		hasNewMessages = false;
	}

	$: forumName = data.forum.name;

	let editingId = null;
	let previewUrl = '';
	let uploading = false;
	let uploadProgress = 0;
	let uploadError = '';
	let images = [];
	let selectedFiles = [];
	let fileInput;

	let isTyping = false;
	let typingTimeout;
	let typingUsers = {};
	let hasNewMessages = false;
	let topObserver;
	let bottomObserver;
	$: typingUsernames = Object.entries(typingUsers)
		.filter(([id]) => id !== String(data.user?.id))
		.map(([, username]) => username);

	function setupSSE() {
		const eventSource = new EventSource(
			`/chat-stream?channel=${encodeURIComponent(data.forum.id)}`
		);

		eventSource.onopen = () => {
			connectionStatus = 'Connected';
			connectionAtempts = 0;
		};

		eventSource.onerror = () => {
			connectionStatus = 'Disconnected';

			if (connectionAtempts < maxConnectionAttempts) {
				connectionStatus = 'Reconnecting...';
				connectionAtempts++;

				setTimeout(() => {
					eventSource.close();
					setupSSE();
				}, 1000 * connectionAtempts);
			} else {
				connectionStatus = 'Failed';
			}
		};
		return eventSource;
	}

	async function requestNotificationPermission() {
		if (!('Notification' in window)) {
			console.log('This browser does not support notifications');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission !== 'denied') {
			const permission = await Notification.requestPermission();
			return permission === 'granted';
		}

		return false;
	}

	function sendPushNotification(title, options = {}) {
		if ('Notification' in window) {
			try {
				new Notification(title, {
					icon: '/favicon.svg',
					...options
				});
			} catch (error) {
				console.error('Error sending notification:', error);
			}
		}
	}

	function handleTyping() {
		if (!isTyping) {
			isTyping = true;
			const formData = new FormData();
			formData.append('userId', data.user.id);
			formData.append('username', data.user.username);
			fetch('?/startTyping', { method: 'POST', body: formData });
		}
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			isTyping = false;
			const formData = new FormData();
			formData.append('userId', data.user.id);
			fetch('?/stopTyping', { method: 'POST', body: formData });
		}, 1000);
	}

	async function loadPreviousPage() {
		if (isLoadingTop || currentMinPage <= 1) return;
		isLoadingTop = true;
		const prevPage = currentMinPage - 1;

		try {
			const response = await fetch(
				`/api/messages?forumId=${encodeURIComponent(data.forum.id)}&page=${prevPage}`
			);
			const result = await response.json();

			if (result.messages && result.messages.length > 0) {
				const newMessages = result.messages.map((msg) => ({
					...msg,
					createdAt: new Date(msg.createdAt)
				}));

				loadedPages.add(prevPage);
				currentMinPage = prevPage;

				// Unload bottom pages if we've reached the limit
				if (loadedPages.size > 5) {
					const pageToRemove = currentMaxPage;
					const pageSize = 10;
					// Remove from the end (oldest messages)
					const messageIds = new Set(newMessages.map((m) => m.id));
					messages = [...newMessages, ...messages.filter((m) => !messageIds.has(m.id))].slice(
						0,
						-pageSize
					);
					loadedPages.delete(pageToRemove);
					currentMaxPage--;
				} else {
					const existingIds = new Set(messages.map((m) => m.id));
					const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id));
					messages = [...uniqueNewMessages, ...messages];
				}
			}
		} catch (error) {
			console.error('Error loading previous page:', error);
		} finally {
			isLoadingTop = false;
		}
	}

	async function loadNextPage() {
		if (isLoadingBottom || currentMaxPage >= data.totalPages) return;
		isLoadingBottom = true;
		const nextPage = currentMaxPage + 1;

		try {
			const response = await fetch(
				`/api/messages?forumId=${encodeURIComponent(data.forum.id)}&page=${nextPage}`
			);
			const result = await response.json();

			if (result.messages && result.messages.length > 0) {
				const newMessages = result.messages.map((msg) => ({
					...msg,
					createdAt: new Date(msg.createdAt)
				}));

				loadedPages.add(nextPage);
				currentMaxPage = nextPage;

				// Unload top pages if we've reached the limit
				if (loadedPages.size > 5) {
					const pageToRemove = currentMinPage;
					const pageSize = 10;
					// Remove from the beginning (newest messages)
					const messageIds = new Set(newMessages.map((m) => m.id));
					messages = [...messages.filter((m) => !messageIds.has(m.id)), ...newMessages].slice(
						pageSize
					);
					loadedPages.delete(pageToRemove);
					currentMinPage++;
				} else {
					const existingIds = new Set(messages.map((m) => m.id));
					const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id));
					messages = [...messages, ...uniqueNewMessages];
				}
			}
		} catch (error) {
			console.error('Error loading next page:', error);
		} finally {
			isLoadingBottom = false;
		}
	}

	if (browser) {
		// Request notification permission
		requestNotificationPermission();

		// Din uppgift: Skapa EventSource connection
		const eventSource = setupSSE();

		eventSource.onmessage = (event) => {
			// Vad ska hända när meddelande tas emot?
			// Tips: JSON.parse(event.data)
			// Tips: Uppdatera messages array
			const data = JSON.parse(event.data);

			switch (data.type) {
				case 'connect':
					console.log('SSE Connected:', data.message);
					return;
				case 'typing': {
					// Hantera typing-indikator här om du vill
					typingUsers[data.user.id] = data.user.username;
					typingUsers = { ...typingUsers };
					break;
				}
				case 'stop_typing': {
					// Hantera stop_typing här om du vill
					delete typingUsers[data.user.id];
					typingUsers = { ...typingUsers };
					break;
				}
				case 'new_message': {
					// Convert createdAt string to Date object
					data.message.createdAt = new Date(data.message.createdAt);
					// Only add message if on first page
					if (currentMinPage === 1) {
						if (!messages.some((m) => m.id === data.message.id)) {
							messages = [data.message, ...messages];
						}
					} else {
						hasNewMessages = true;
					}
					// Send push notification for new message to other users
					const authorId = data.message.user?.id;
					const currentUserId = data.user?.id;
					console.log(
						'Message received - Author ID:',
						authorId,
						'Current User ID:',
						currentUserId,
						'Should notify:',
						authorId !== currentUserId
					);
					if (authorId !== currentUserId) {
						console.log('Sending notification...');
						sendPushNotification('🔔 Nytt meddelande', {
							body: `${data.message.author}: ${data.message.content.substring(0, 50)}${data.message.content.length > 50 ? '...' : ''}`
						});
					} else {
						console.log('Not sending notification - same user');
					}
					break;
				}
				case 'initial_messages': {
					// Convert createdAt strings to Date objects
					const initialMessages = data.messages.map((msg) => {
						return { ...msg, createdAt: new Date(msg.createdAt) };
					});
					messages = initialMessages;
					break;
				}
				default:
					console.warn('Unknown SSE message type:', data.type);
			}
		};

		eventSource.onerror = () => {
			// Vad ska hända vid fel?
			// Tips: Uppdatera connectionStatus
			connectionStatus = 'Disconnected';
		};

		// Viktigt: Stäng connection när komponenten förstörs
		onDestroy(() => {
			// Din kod här
			eventSource.close();
			if (topObserver) topObserver.disconnect();
			if (bottomObserver) bottomObserver.disconnect();
		});
	}

	// Setup intersection observers for infinite scroll with reactive statements
	$: if (browser && topSentinel) {
		if (topObserver) topObserver.disconnect();
		topObserver = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadPreviousPage();
				}
			},
			{ threshold: 0.1 }
		);
		topObserver.observe(topSentinel);
	}

	$: if (browser && bottomSentinel) {
		if (bottomObserver) bottomObserver.disconnect();
		bottomObserver = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadNextPage();
				}
			},
			{ threshold: 0.1 }
		);
		bottomObserver.observe(bottomSentinel);
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

	function syncFileInput() {
		if (!fileInput) return;
		const dataTransfer = new DataTransfer();
		for (const file of selectedFiles) {
			dataTransfer.items.add(file);
		}
		fileInput.files = dataTransfer.files;
	}

	function handleMessageSubmit(event) {
		event.preventDefault();
		if (uploading) return;

		const formEl = event.currentTarget;
		const formData = new FormData(formEl);

		uploading = true;
		uploadProgress = 0;
		uploadError = '';

		const xhr = new XMLHttpRequest();
		xhr.open(formEl.method || 'POST', formEl.action);
		xhr.setRequestHeader('Accept', 'application/json');

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) {
				uploadProgress = Math.round((e.loaded / e.total) * 100);
			}
		};

		xhr.onload = async () => {
			uploading = false;
			uploadProgress = 0;

			let result;
			try {
				result = JSON.parse(xhr.responseText);
				await applyAction(result);
			} catch (error) {
				console.error('Failed to apply action result', error);
			}

			if (result?.type === 'success' || (xhr.status >= 200 && xhr.status < 300)) {
				images = [];
				selectedFiles = [];
				previewUrl = '';
				if (fileInput) fileInput.value = '';
				const messageField = formEl.querySelector('textarea[name="content"]');
				if (messageField) messageField.value = '';
			} else {
				uploadError = result?.data?.error ?? 'Uppladdningen misslyckades. Försök igen.';
			}
		};

		xhr.onerror = () => {
			uploading = false;
			uploadProgress = 0;
			uploadError = 'Nätverksfel. Kontrollera anslutningen och försök igen.';
		};

		xhr.send(formData);
	}
</script>

<div class="container">
	<header class="page-header">
		<h1>Forum: {forumName}</h1>
		<nav class="breadcrumb">
			<a href={resolve('/forums')}>Alla Forum</a> <span>/</span>
			{forumName}
		</nav>
		<div class="connection-indicator">
			Connection status:
			{#if connectionStatus === 'Connected'}
				🟢
			{:else if connectionStatus === 'Reconnecting...'}
				🟡 Reconnecting...
			{:else if connectionStatus === 'Connecting'}
				🟡 Connecting...
			{:else if connectionStatus === 'Disconnected'}
				🔴
			{:else if connectionStatus === 'Failed'}
				⚠️
			{/if}
		</div>
	</header>

	<div class="content-wrapper">
		<section class="messages-section">
			{#if hasNewMessages}
				<div class="new-messages-notification">
					<p>🔔 Nya meddelanden har lagts till på sidan 1</p>
					<a href={resolve(`/forums/${data.forum.name}?page=1`)}>Gå till sidan 1</a>
				</div>
			{/if}
			<div
				style="display: flex; flex-direction: row; gap: 0.5rem; margin-bottom: 1rem; align-items: center;"
			>
				<h2>Meddelanden ({messages.length})</h2>
				{#if typingUsernames.length > 0}
					<p>
						{typingUsernames.length === 1
							? `${typingUsernames.length} person skriver...`
							: `${typingUsernames.length} personer skriver...`}
					</p>
				{/if}
			</div>
			<div class="messages-list">
				<!-- Top sentinel for loading previous pages -->
				{#if currentMinPage > 1}
					<div bind:this={topSentinel} class="scroll-sentinel">
						{#if isLoadingTop}
							<p class="loading-indicator">Laddar tidigare meddelanden...</p>
						{/if}
					</div>
				{/if}

				{#each messages as message (message.id)}
					<div class="message" in:fly={{ y: 20 }}>
						{#if data.user && editingId === message.id}
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
										{#each message.images as image (image.id)}
											<img src={image.data} alt={image.filename} class="message-image" />
										{/each}
									</div>
								{/if}
								<div class="message-meta">
									<div class="avatar-block">
										{#if message.user?.profileImage}
											<img
												src={message.user.profileImage}
												alt={message.user.username}
												width="32"
												height="32"
												class="avatar"
											/>
										{:else}
											<div class="avatar placeholder">
												{message.author?.[0]?.toUpperCase() ?? '?'}
											</div>
										{/if}
										<em>{message.author}</em>
									</div>
									<span class="message-date">{message.createdAt.toLocaleString()}</span>
								</div>
							</div>
							{#if data.user && data.user.id === message.userId}
								<form
									action="?/delete"
									method="POST"
									class="delete-form"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update();
											if (result.type === 'success') {
												await invalidateAll();
											}
										};
									}}
								>
									<input type="hidden" name="id" value={message.id} />
									<button type="submit">Ta bort</button>
								</form>
							{/if}
						{/if}
					</div>
				{/each}

				<!-- Bottom sentinel for loading next pages -->
				{#if currentMaxPage < data.totalPages}
					<div bind:this={bottomSentinel} class="scroll-sentinel">
						{#if isLoadingBottom}
							<p class="loading-indicator">Laddar fler meddelanden...</p>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		{#if data.user}
			<aside class="actions-section">
				{#if form?.error}
					<p class="error">{form.error}</p>
				{/if}

				<form
					method="POST"
					action="?/message"
					class="create-message-form"
					enctype="multipart/form-data"
					on:submit={handleMessageSubmit}
				>
					<h3>Nytt meddelande</h3>

					<textarea name="content" required placeholder="Ditt meddelande..." on:input={handleTyping}
						>{form?.content ?? ''}</textarea
					>
					{#if previewUrl}
						<div style="overflow-x: auto; display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
							{#each images as image, i (i)}
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
					{#if uploading}
						<div class="progress">
							<div class="progress-bar" style={`width: ${uploadProgress}%`}></div>
						</div>
						<p class="progress-text">{uploadProgress}%</p>
					{/if}
					{#if uploadError}
						<p class="error">{uploadError}</p>
					{/if}
					<button type="submit" disabled={uploading}>{uploading ? 'Skickar...' : 'Skicka'}</button>
				</form>

				<form method="GET" action="" class="search-form">
					<h3>Sök</h3>
					<input type="text" name="filter" placeholder="Sök meddelanden..." autocomplete="off" />
					<button type="submit">Sök</button>
				</form>
			</aside>
		{/if}
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
		overflow: hidden;
	}

	.page-header {
		text-align: center;
		margin-bottom: 1.5rem;
		max-width: 600px;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.connection-indicator {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #4a5568;
	}

	.new-messages-notification {
		background: #f7fafc;
		border: 1px solid #cbd5e0;
		border-left: 3px solid #667eea;
		color: #4a5568;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		animation: slideDown 0.3s ease;
	}

	.new-messages-notification p {
		margin: 0;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.new-messages-notification a {
		color: #667eea;
		background: rgba(102, 126, 234, 0.1);
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.85rem;
		transition: all 0.2s ease;
	}

	.new-messages-notification a:hover {
		background: rgba(102, 126, 234, 0.15);
		transform: translateY(-1px);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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
		top: 0.2rem;
		right: 0.2rem;
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

	.avatar-block {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.avatar {
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #e2e8f0;
	}

	.avatar.placeholder {
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-weight: 700;
		border: 2px solid #e2e8f0;
		font-size: 0.9rem;
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

	.scroll-sentinel {
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-indicator {
		color: #a0aec0;
		font-size: 0.9rem;
		font-style: italic;
		margin: 0;
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

	.progress {
		width: 100%;
		height: 10px;
		background: #e2e8f0;
		border-radius: 999px;
		overflow: hidden;
		margin: 0.5rem 0 0.25rem;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		transition: width 0.2s ease;
	}

	.progress-text {
		text-align: center;
		color: #4a5568;
		font-size: 0.9rem;
		margin: 0 0 0.5rem;
	}

	.create-message-form,
	.search-form {
		background: white;
		padding: 1.3rem;
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
