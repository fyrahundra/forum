<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	export let data;

	let previewUrl = '';
	let uploading = false;

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file) {
			// Hur skapar du en preview URL?
			// Tips: URL.createObjectURL() eller FileReader
			previewUrl = URL.createObjectURL(file);
		}
	}
</script>

<h1>Profile</h1>
{#if data && data.user}
	<!-- Fil-form behöver speciell encoding -->
	<form
		method="POST"
		action="?/uploadToFile"
		enctype="multipart/form-data"
		use:enhance={() => {
			uploading = true;
			return async ({ update }) => {
				await update();
				uploading = false;
				previewUrl = '';
			};
		}}
	>
		<input
			type="file"
			name="image"
			accept="image/*"
			disabled={uploading}
			on:change={handleFileSelect}
		/>
		{#if previewUrl}
			<img src={previewUrl} alt="Preview" height="150" width="150" />
		{/if}
		<button disabled={uploading}>{uploading ? 'Laddar upp...' : 'Ladda upp profilbild'}</button>
		<input type="hidden" name="userId" value={data.user.id} />
	</form>

	<div class="user-info">
		{#if data.user.profileImage}
			<img src={data.user.profileImage} alt="Uploaded" />
		{/if}
		<p><strong>Användarnamn:</strong> {data.user.username}</p>
		<p><strong>E-post:</strong> {data.user.email}</p>
	</div>

	<div class="profile-links">
		<a href={resolve("/sessions")}>Active Sessions</a>
	</div>
{:else}
	<p>Du är inte inloggad.</p>
{/if}

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 2rem;
		color: white;
		font-weight: 700;
		text-align: center;
	}

	form {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	input[type='file'] {
		display: block;
		width: fit-content;
		max-width: 100%;
		padding: 1rem;
		margin: 0 auto 1rem;
		border: 2px dashed #667eea;
		border-radius: 8px;
		background: #f8f9ff;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	input[type='file']:hover {
		border-color: #764ba2;
		background: #f0f2ff;
	}

	input[type='file']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	form img {
		display: block;
		margin: 1rem auto;
		border-radius: 50%;
		border: 4px solid #667eea;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	button {
		width: 100%;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.user-info {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		max-width: 500px;
		margin: 2rem auto;
		text-align: center;
	}

	.user-info img {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		border: 5px solid #667eea;
		margin: 0 auto 1.5rem;
		box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
		display: block;
		object-fit: cover;
	}

	.profile-links {
		background: white;
		padding: 1rem;
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		max-width: 150px;
		margin: 0.5rem auto;
		text-align: center;
	}

	p {
		font-size: 1.1rem;
		margin: 1rem 0;
		color: #4a5568;
		line-height: 1.8;
		padding: 0.5rem;
	}

	p strong {
		color: #667eea;
		font-weight: 600;
		display: inline-block;
		min-width: 120px;
		text-align: left;
	}
</style>
