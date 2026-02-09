<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<nav class="navbar">
		<a href="/" class="logo">TypeArt</a>
		<div class="nav-links">
			<a href="/configure">Configure</a>
			<a href="/test">Test</a>
		</div>
	</nav>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
		height: 56px;
		background-color: var(--base02);
		border-bottom: 1px solid var(--base01);
		flex-shrink: 0;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.02em;
	}

	.logo:hover {
		text-decoration: none;
		color: var(--yellow);
	}

	.nav-links {
		display: flex;
		gap: 24px;
	}

	.nav-links a {
		color: var(--base0);
		font-size: 0.875rem;
		font-weight: 500;
		transition: color 100ms ease;
	}

	.nav-links a:hover {
		color: var(--base1);
		text-decoration: none;
	}

	.content {
		flex: 1;
		padding: 24px;
	}
</style>
