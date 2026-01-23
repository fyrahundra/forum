<script>
	export let data;
</script>

<h1>Active Sessions</h1>

<div class="sessions">
	{#each data.sessions as session (session.id)}
		<div class="session-card">
			<div class="device-info">
				<strong>{session.deviceName || 'Unknown Device'}</strong>
				<p>{session.userAgent}</p>
				<small>IP: {session.ipAddress}</small>
				<small>Country: {data.country}</small>
			</div>

			<div class="session-meta">
				<p>Created: {new Date(session.createdAt).toLocaleString()}</p>
				<p>Last used: {new Date(session.lastUsed).toLocaleString()}</p>
				<p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>
			</div>

			<div class="actions">
				{#if session.id === data.currentSessionId}
					<span class="current">Current Session: {session.id}</span>
				{:else}
					<form method="POST" action="?/revokeSession">
						<input type="hidden" name="sessionId" value={session.id} />
						<button type="submit" class="danger">Revoke</button>
					</form>
				{/if}
			</div>
		</div>
	{/each}
</div>

<form method="POST" action="?/revokeAllSessions" class="revoke-all-form">
	<button type="submit" class="danger">Log out all devices</button>
</form>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		padding: 2rem;
	}

	h1 {
		color: white;
		font-size: 2.5rem;
		margin-bottom: 2rem;
		text-align: center;
		font-weight: 700;
	}

	.sessions {
		max-width: 1200px;
		margin: 0 auto 2rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.session-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s, box-shadow 0.3s;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.session-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
	}

	.device-info {
		border-bottom: 2px solid #f0f2ff;
		padding-bottom: 1rem;
	}

	.device-info strong {
		font-size: 1.25rem;
		color: #2c3e50;
		display: block;
		margin-bottom: 0.5rem;
	}

	.device-info p {
		color: #718096;
		font-size: 0.9rem;
		margin: 0.25rem 0;
		word-break: break-all;
	}

	.device-info small {
		display: block;
		color: #a0aec0;
		font-size: 0.85rem;
		margin-top: 0.25rem;
	}

	.session-meta {
		border-bottom: 2px solid #f0f2ff;
		padding-bottom: 1rem;
	}

	.session-meta p {
		color: #4a5568;
		font-size: 0.9rem;
		margin: 0.5rem 0;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.actions form {
		width: 100%;
	}

	.current {
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		text-align: center;
		box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
		font-size: 0.9rem;
	}

	button.danger {
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
	}

	button.danger:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 101, 101, 0.4);
	}

	.revoke-all-form {
		max-width: 400px;
		margin: 0 auto;
	}

	.revoke-all-form button.danger {
		padding: 1rem 2rem;
		font-size: 1.05rem;
	}
</style>
