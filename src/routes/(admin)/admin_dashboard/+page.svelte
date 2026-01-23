<script lang="ts">
	export let data: {
		activeSessions: {
			id: string;
			token: string;
			deviceName: string | null;
			createdAt: string;
			lastUsed: string;
			expiresAt: string;
			user: { id: string; username: string; email: string; role: string } | null;
		}[];
	};
</script>

<h2 class="page-title">Active Sessions</h2>

<table class="sessions-table">
	<thead>
		<tr>
			<th>User</th>
			<th>Email</th>
			<th>Role</th>
			<th>Device</th>
			<th>Token</th>
			<th>Created At</th>
			<th>Last Used</th>
			<th>Expires At</th>
		</tr>
	</thead>
	<tbody>
		{#each data.activeSessions as session}
			<tr>
				<td>{session.user?.username ?? 'Unknown'}</td>
				<td>{session.user?.email ?? '-'}</td>
				<td>{session.user?.role ?? '-'}</td>
				<td>{session.deviceName ?? '-'}</td>
				<td class="token-cell">{session.token}</td>
				<td>{new Date(session.createdAt).toLocaleString()}</td>
				<td>{new Date(session.lastUsed).toLocaleString()}</td>
				<td>{new Date(session.expiresAt).toLocaleString()}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.page-title {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.sessions-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.sessions-table th,
	.sessions-table td {
		padding: 0.5rem 1rem;
		border-bottom: 1px solid #ddd;
		text-align: left;
		font-size: 0.9rem;
	}

	.sessions-table th {
		background: #667eea;
		color: white;
	}

	.sessions-table tr:nth-child(even) {
		background: #f7f7f7;
	}

	.sessions-table tr:hover {
		background: #e0e7ff;
	}

	.token-cell {
		font-family: monospace;
		font-size: 0.8rem;
		word-break: break-all;
	}
</style>
