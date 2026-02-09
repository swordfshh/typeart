<script lang="ts">
	const isWebHIDSupported = typeof navigator !== 'undefined' && 'hid' in navigator;
</script>

<div class="home">
	<div class="hero">
		<h1>TypeArt</h1>
		<p class="subtitle">Live keymap editor for custom QMK keyboards</p>
	</div>

	{#if !isWebHIDSupported}
		<div class="warning-card">
			<span class="warning-icon">!</span>
			<div>
				<strong>WebHID not available</strong>
				<p>
					This app requires WebHID, which is only supported in Chrome and Edge.
					Please open this page in a compatible browser.
				</p>
			</div>
		</div>
	{/if}

	<div class="cards">
		<a href="/configure" class="card">
			<h2>Configure</h2>
			<p>Connect your keyboard and edit keymaps live</p>
		</a>
		<a href="/test" class="card">
			<h2>Matrix Test</h2>
			<p>Test key switches with real-time matrix visualization</p>
		</a>
	</div>
</div>

<style>
	.home {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	.hero {
		text-align: center;
		margin-bottom: 48px;
	}

	.hero h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
	}

	.subtitle {
		margin-top: 8px;
		font-size: 1.125rem;
		color: var(--base00);
	}

	.warning-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background-color: var(--base02);
		border: 1px solid var(--orange);
		border-radius: var(--radius-md);
		margin-bottom: 32px;
	}

	.warning-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background-color: var(--orange);
		color: var(--base03);
		border-radius: 50%;
		font-weight: 700;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.warning-card strong {
		color: var(--orange);
	}

	.warning-card p {
		margin-top: 4px;
		font-size: 0.875rem;
		color: var(--base00);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.card {
		display: block;
		padding: 24px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
		transition: border-color 100ms ease, box-shadow 100ms ease;
	}

	.card:hover {
		text-decoration: none;
		border-color: var(--blue);
		box-shadow: var(--shadow-md);
	}

	.card h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--base1);
		margin-bottom: 8px;
	}

	.card p {
		font-size: 0.875rem;
		color: var(--base00);
	}
</style>
