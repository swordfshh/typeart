<script lang="ts">
	const isWebHIDSupported = typeof navigator !== 'undefined' && 'hid' in navigator;
</script>

<div class="home">
	<div class="hero">
		<h1><span class="r1">T</span><span class="r2">y</span><span class="r3">p</span><span class="r4">e</span><span class="r5">A</span><span class="r6">r</span><span class="r7">t</span></h1>
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
		<a href="/store" class="card card-full">
			<h2>Store</h2>
			<p>Browse and order TypeArt keyboard kits</p>
		</a>
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
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 2.5rem;
		font-weight: 560;
		font-style: italic;
		letter-spacing: -0.03em;
	}

	.hero .r1 { color: #c4443a; }
	.hero .r2 { color: #c86a2a; }
	.hero .r3 { color: #b8941e; }
	.hero .r4 { color: #4a8c3f; }
	.hero .r5 { color: #2e7bab; }
	.hero .r6 { color: #5b4a9e; }
	.hero .r7 { color: #8b3a8b; }

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
		color: var(--on-accent);
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
		grid-template-columns: repeat(2, 1fr);
		grid-auto-rows: 1fr;
		gap: 16px;
	}

	.card {
		display: block;
		padding: 24px;
		background: var(--base02);
		border: 2px solid var(--base01);
		border-radius: var(--radius-lg);
		transition: box-shadow 100ms ease;
	}

	.card:hover {
		text-decoration: none;
		border-color: transparent;
		background:
			linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(to right, #e0453b, #e87d2a, #d4a81e, #54a648, #339cc5, #7058b8, #a8449e) border-box;
		box-shadow: var(--shadow-md);
	}

	.card-full {
		grid-column: 1 / -1;
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
