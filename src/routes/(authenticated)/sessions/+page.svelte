<script>
	export let data;
</script>

<h1>Active Sessions</h1>

<div class="sessions">
	{#each data.sessions as session}
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

<form method="POST" action="?/revokeAllSessions">
	<button type="submit" class="danger">Log out all devices</button>
</form>
