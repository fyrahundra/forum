<script>
	export let data;
	// Data från parent + egen data
</script>

<div class="public-layout">
	<header class="public-header">
		<nav>
			<a href="/">Home</a>
			<a href="/forums">Forums</a>
			<a href="/login" class="login-link">Login</a>
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
		background-color: rgba(255, 255, 255);
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		width: 99%;
	}

	.public-header nav {
		display: flex;
		align-items: center;
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

	.login-link {
		margin-left: auto;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		padding: 0.5rem 1rem;
		border-radius: 25px;
	}
	.login-link:hover {
		color: #fff;
		transform: scale(1.1, 1.1);
		text-decoration: none;
	}

	.public-main {
		flex: 1;
		/* Content area styling */
	}
</style>
