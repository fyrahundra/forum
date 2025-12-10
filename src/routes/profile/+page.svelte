<script>
	export let data;
</script>

<h1>Profil</h1>
{#if data && data.user}
	<p><strong>Användarnamn:</strong> {data.user.username}</p>
	<p><strong>E-post:</strong> {data.user.email}</p>
{:else}
	<p>Du är inte inloggad.</p>
{/if}

<style>
	:global(body) {
		margin: 0;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 2rem;
		color: #2c3e50;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	p {
		font-size: 1.1rem;
		margin: 1rem 0;
		color: #4a5568;
		line-height: 1.8;
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	p strong {
		color: #667eea;
		font-weight: 600;
	}
</style>
