<svelte:head>
	<title>TypeArt — Custom Keyboard Kits & Configuration Tools</title>
	<meta name="description" content="Custom mechanical keyboard kits with gasket mount and hot-swap sockets, plus a live keymap configurator, typing test, and matrix tester. Free shipping." />
	<meta property="og:title" content="TypeArt — Custom Keyboard Kits & Configuration Tools" />
	<meta property="og:description" content="Custom mechanical keyboard kits with gasket mount and hot-swap sockets, plus a live keymap configurator, typing test, and matrix tester." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://typeart.co" />
	<meta property="og:image" content="https://typeart.co/logo-dark.png" />
	<meta name="twitter:card" content="summary" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"name": "TypeArt",
				"url": "https://typeart.co",
				"logo": "https://typeart.co/logo-dark.png"
			},
			{
				"@type": "WebSite",
				"name": "TypeArt",
				"url": "https://typeart.co"
			}
		]
	})}</script>`}
</svelte:head>

<div class="home">
	<div class="hero">
		<h1><span class="r1">T</span><span class="r2">y</span><span class="r3">p</span><span class="r4">e</span><span class="r5">A</span><span class="r6">r</span><span class="r7">t</span></h1>
		<p class="subtitle">Unique keyboard kits and configuration tools</p>
	</div>

	<div class="cards">
		<a href="/store" class="card">
			<h2>Store</h2>
			<p>Browse and order TypeArt keyboard kits</p>
		</a>
		<a href="/configure" class="card">
			<h2>Configure</h2>
			<p>Connect your keyboard and edit keymaps live</p>
		</a>
		<a href="/type" class="card">
			<h2>Typing Test</h2>
			<p>Measure your typing speed with time, words, and quote modes</p>
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

	:global([data-theme="miami-nights"]) .hero .r1 { color: #0AD2D3; }
	:global([data-theme="miami-nights"]) .hero .r2 { color: #00D4FF; }
	:global([data-theme="miami-nights"]) .hero .r3 { color: #B537F2; }
	:global([data-theme="miami-nights"]) .hero .r4 { color: #FF2E97; }
	:global([data-theme="miami-nights"]) .hero .r5 { color: #0AD2D3; }
	:global([data-theme="miami-nights"]) .hero .r6 { color: #00D4FF; }
	:global([data-theme="miami-nights"]) .hero .r7 { color: #FF2E97; }

	:global([data-theme="godspeed"]) .hero .r1 { color: #ffdb58; }
	:global([data-theme="godspeed"]) .hero .r2 { color: #e8a735; }
	:global([data-theme="godspeed"]) .hero .r3 { color: #5991ae; }
	:global([data-theme="godspeed"]) .hero .r4 { color: #ba1312; }
	:global([data-theme="godspeed"]) .hero .r5 { color: #ffdb58; }
	:global([data-theme="godspeed"]) .hero .r6 { color: #5991ae; }
	:global([data-theme="godspeed"]) .hero .r7 { color: #e8a735; }

	.subtitle {
		margin-top: 8px;
		font-size: 1.125rem;
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

	:global([data-theme="miami-nights"]) .card {
		border-width: 1.33px;
	}

	.card:hover {
		text-decoration: none;
		border-color: transparent;
		background:
			linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(to right, #e0453b, #e87d2a, #d4a81e, #54a648, #339cc5, #7058b8, #a8449e) border-box;
		box-shadow: var(--shadow-md);
	}

	:global([data-theme="miami-nights"]) .card:hover {
		background:
			linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(to right, #0AD2D3, #00D4FF, #B537F2, #FF2E97, #FF3366) border-box !important;
	}

	:global([data-theme="godspeed"]) .card:hover {
		background:
			linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(to right, #ffdb58, #e8a735, #ba1312, #5991ae, #69d0a5) border-box !important;
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
