<script>
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	export let data;

	$: breadcrumbs = generateBreadcrumbs($page.url.pathname);

	function generateBreadcrumbs(pathname) {
		const segments = pathname.split('/').filter(Boolean);
		const crumbs = [];
		let accumulatedPath = '';

		segments.forEach((segment) => {
			accumulatedPath += `/${segment}`;
			crumbs.push({
				label: decodeURIComponent(segment),
				href: accumulatedPath
			});
		});
		return crumbs;
	}
	// Data från parent + egen data
</script>

<div class="public-layout">
	<header class="public-header">
		<nav>
			<a href={resolve('/')}>Home</a>
			<a href={resolve('/forums')}>Forums</a>
			<a href={resolve('/profile')}>Profile</a>
			{#if data.user.role === 'admin'}
				<a href={resolve('/admin_dashboard')}>Admin Dashboard</a>
			{/if}
			<div class="breadcrumbs">
				{#each breadcrumbs as crumb, i (crumb.href)}
					{#if i < breadcrumbs.length - 1}
						<a href={resolve(crumb.href)}>{crumb.label}</a>
						<span class="separator">›</span>
					{:else}
						<span class="current">{crumb.label}</span>
					{/if}
				{/each}
			</div>
			<form action={resolve('/logout')} method="POST" style="margin-left: auto;">
				<button type="submit" class="logout">Logout</button>
			</form>
		</nav>
	</header>

	<main class="public-main">
		<slot />
	</main>
</div>

<style>
	.public-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.public-header {
		background-color: rgba(255, 255, 255, 0.95);
		padding: 1rem 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		backdrop-filter: blur(10px);
	}

	.public-header nav {
		display: flex;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
	}

	nav a {
		margin-right: 1.5rem;
		text-decoration: none;
		color: #333;
		font-weight: 600;
	}

	nav a:hover {
		color: #667eea;
		text-decoration: underline;
	}

	.logout {
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		padding: 0.5rem 1rem;
		border-radius: 25px;
		border: none; /* remove default border */
		outline: none; /* remove default outline */
		cursor: pointer; /* pointer on hover */
		font: inherit; /* inherit font from nav */
		text-decoration: none;
		display: inline-flex; /* allows proper alignment inside nav */
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease; /* smooth hover effect */
	}

	.logout:hover {
		transform: scale(1.1);
		color: #fff;
	}

	.public-main {
		flex: 1;
		width: 100%;
		padding-top: 80px;
		/* Content area styling */
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		font-size: 0.9rem;
		color: #666;
		margin-left: auto;
		flex-wrap: wrap;
	}

	.breadcrumbs a {
		text-decoration: none;
	}

	.separator {
		margin: 0 0.2rem;
	}

	.current {
		font-weight: bold;
		color: #333;
	}
</style>
