<svelte:head>
	<title>About TypeArt — Custom Mechanical Keyboard Kits & Tools</title>
	<meta name="description" content="TypeArt designs compact mechanical keyboard kits (40% and QAZ layouts) with gasket mount, hot-swap sockets, and QMK/VIA firmware. Plus free online tools: keymap configurator, typing test, and matrix tester." />
	<meta property="og:title" content="About TypeArt — Custom Mechanical Keyboard Kits & Tools" />
	<meta property="og:description" content="Compact mechanical keyboard kits with gasket mount and hot-swap sockets, plus free online keyboard tools." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://typeart.co/about" />
	<meta property="og:image" content="https://typeart.co/images/kb/20250113_094108-EDIT.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "AboutPage",
		"name": "About TypeArt",
		"url": "https://typeart.co/about",
		"mainEntity": {
			"@type": "Organization",
			"name": "TypeArt",
			"url": "https://typeart.co",
			"logo": "https://typeart.co/logo-dark.png",
			"description": "TypeArt designs compact mechanical keyboard kits and free online keyboard tools.",
			"brand": {
				"@type": "Brand",
				"name": "TypeArt"
			}
		}
	})}</script>`}
</svelte:head>

<div class="about-page">
	<h1>About TypeArt</h1>
	<p class="lead">We design compact mechanical keyboard kits and free browser-based tools for the keyboard community.</p>

	<figure class="hero-img">
		<img
			src="/images/kb/20250113_094108-EDIT.jpg"
			alt="TypeArt Type 40 compact 40% mechanical keyboard with Japanese keycaps and rotary encoder knob"
			loading="eager"
		/>
	</figure>

	<section>
		<h2>What We Make</h2>
		<p>TypeArt makes compact mechanical keyboard kits — boards you build yourself with your own switches and keycaps. Every kit ships with a 3D-printed PLA case, PCB with hot-swap sockets, gummy o-ring gasket mount, 2mm PORON foam dampener, and USB-C connectivity. Firmware is QMK with full VIA support, so you can remap any key without reflashing.</p>
		<p>We currently offer two layouts:</p>

		<div class="product-cards">
			<a href="/store/type-40" class="product-link">
				<img
					src="/images/products/type-40/1.jpg"
					alt="Type 40 — 40% staggered mechanical keyboard kit with rotary encoder and arrow keys"
					loading="lazy"
				/>
				<div class="product-link-info">
					<strong>Type 40</strong>
					<span>40% staggered layout with rotary encoder knob and dedicated arrow keys. The daily driver for people who want compact without giving up navigation.</span>
				</div>
			</a>
			<a href="/store/type-qaz" class="product-link">
				<img
					src="/images/products/type-qaz/1.jpg"
					alt="Type QAZ — ultra-compact 35% QAZ staggered mechanical keyboard kit"
					loading="lazy"
				/>
				<div class="product-link-info">
					<strong>Type QAZ</strong>
					<span>36-key QAZ staggered layout. Ultra-compact for layer-heavy typists who want the smallest possible board that's still comfortable.</span>
				</div>
			</a>
		</div>
		<p>Both kits ship with free US shipping. Browse the <a href="/store">store</a> for full specs and pricing.</p>
	</section>

	<section>
		<h2>What's in the Kit</h2>
		<p>Every TypeArt keyboard kit includes everything you need except switches and keycaps — those are your choice. Here's what you get:</p>
		<ul>
			<li><strong>PCB</strong> — hot-swap sockets (no soldering), USB-C, QMK/VIA firmware pre-flashed</li>
			<li><strong>Case</strong> — 3D-printed PLA, available in Galaxy Black, Void Purple, or Translucent</li>
			<li><strong>Plate</strong> — integrated into the case design</li>
			<li><strong>Gasket mount</strong> — gummy o-ring gaskets for a soft, even typing feel</li>
			<li><strong>Foam</strong> — 2mm PORON dampener between PCB and case</li>
			<li><strong>Stabilizers</strong> — optional Durock V3 screw-in stabilizers (add-on)</li>
			<li><strong>Wrist rest</strong> — optional matching 3D-printed wrist rest (add-on)</li>
		</ul>

		<figure>
			<img
				src="/images/kb/20250126_100623.jpg"
				alt="TypeArt Type 40 mechanical keyboard with matching wrist rests on a desk"
				loading="lazy"
			/>
			<figcaption>Type 40 with matching wrist rests</figcaption>
		</figure>
	</section>

	<section>
		<h2>Building Your Keyboard</h2>
		<p>Assembly takes about 15 minutes. No soldering required — the hot-swap sockets accept any MX-compatible switch. Just press your switches into the PCB, drop it into the case, and add keycaps. Plug in USB-C and you're typing.</p>
		<h3>What You'll Need</h3>
		<ul>
			<li><strong>MX-compatible switches</strong> — any Cherry MX, Gateron, Kailh, or similar 5-pin switch. Popular choices: Gateron Milky Yellows (budget linear), Boba U4T (tactile), or Cherry MX Browns.</li>
			<li><strong>Keycaps</strong> — any MX-stem keycap set. Make sure it covers your layout (40% sets are less common, but most full-size sets include the keys you need).</li>
			<li><strong>A USB-C cable</strong> — for connecting to your computer.</li>
		</ul>
		<p>Once built, use our <a href="/configure">keymap configurator</a> to remap keys, set up layers, and customize your layout — all from your browser over WebHID, no reflashing needed.</p>

		<figure>
			<img
				src="/images/kb/20250119_230953.jpg"
				alt="TypeArt Type 40 mechanical keyboard with backlit keycaps under purple ambient lighting"
				loading="lazy"
			/>
			<figcaption>Type 40 in Galaxy Black</figcaption>
		</figure>
	</section>

	<section>
		<h2>Why Compact Keyboards</h2>
		<p>Smaller keyboards aren't about giving things up — they're about putting everything closer. On a 40% layout, every key is one row from home. Your fingers stay centered, your wrists stay straight, and layers give you access to numbers, symbols, and navigation without reaching.</p>
		<p>It takes a day or two to adjust. After that, full-size boards feel like reaching across a table. The Type 40 keeps arrow keys and a rotary encoder for people who want that. The Type QAZ goes all-in on minimalism for typists who are comfortable with layers.</p>

		<figure>
			<img
				src="/images/kb/20250629_172716.jpg"
				alt="TypeArt Type QAZ ultra-compact 35% keyboard in Void Purple 3D-printed case"
				loading="lazy"
			/>
			<figcaption>Type QAZ in Void Purple</figcaption>
		</figure>
	</section>

	<section>
		<h2>Online Keyboard Tools</h2>
		<p>We build free browser-based tools for the mechanical keyboard community. No downloads, no accounts required.</p>
		<div class="tools-grid">
			<a href="/configure" class="tool-card">
				<strong>Keymap Configurator</strong>
				<span>Remap keys, set up layers, and configure your VIA-compatible keyboard live over WebHID. Changes apply instantly — no reflashing.</span>
			</a>
			<a href="/type" class="tool-card">
				<strong>Typing Test</strong>
				<span>Measure your typing speed in WPM with timed, word count, and quote modes. Track personal bests and compete on the leaderboard.</span>
			</a>
			<a href="/test" class="tool-card">
				<strong>Matrix Tester</strong>
				<span>Visualize every key press and encoder rotation in real time. Useful for verifying switches after a build or diagnosing dead keys.</span>
			</a>
		</div>
	</section>

	<section>
		<h2>Open Firmware</h2>
		<p>All TypeArt keyboards run <a href="https://qmk.fm" target="_blank" rel="noopener">QMK</a> firmware with <a href="https://usevia.app" target="_blank" rel="noopener">VIA</a> support. QMK is the open-source firmware standard for custom mechanical keyboards — it gives you full control over key mapping, macros, tap-hold behavior, combos, and more. VIA adds a graphical layer on top so you can make changes without recompiling.</p>
		<p>Firmware binaries for both boards are available on the <a href="/configure">configurator page</a>. Flash with any QMK-compatible tool.</p>
	</section>

	<section class="contact-section">
		<h2>Get in Touch</h2>
		<p>Questions about a kit, custom orders, or just want to talk keyboards? Reach us at <a href="mailto:hello@typeart.co">hello@typeart.co</a>.</p>
	</section>
</div>

<style>
	.about-page {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		margin-bottom: 8px;
	}

	.lead {
		font-size: 1.05rem;
		color: var(--base00);
		line-height: 1.6;
		margin-bottom: 32px;
	}

	.hero-img {
		margin: 0 0 40px;
	}

	.hero-img img {
		width: 100%;
		border-radius: var(--radius-lg);
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}

	section {
		margin-bottom: 40px;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--base1);
		margin-bottom: 12px;
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--base1);
		margin: 20px 0 8px;
	}

	p {
		font-size: 0.875rem;
		color: var(--base0);
		line-height: 1.7;
		margin-bottom: 12px;
	}

	p a {
		color: var(--blue);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 12px 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	li {
		font-size: 0.875rem;
		color: var(--base0);
		line-height: 1.6;
		padding-left: 16px;
		position: relative;
	}

	li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 9px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: var(--base01);
	}

	figure {
		margin: 20px 0;
	}

	figure img {
		width: 100%;
		border-radius: var(--radius-lg);
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}

	figcaption {
		margin-top: 8px;
		font-size: 0.75rem;
		color: var(--base00);
		text-align: center;
	}

	.product-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin: 16px 0;
	}

	.product-link {
		display: flex;
		flex-direction: column;
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	.product-link:hover {
		border-color: var(--blue);
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}

	.product-link img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}

	.product-link-info {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.product-link-info strong {
		font-size: 0.9rem;
		color: var(--base1);
	}

	.product-link-info span {
		font-size: 0.8rem;
		color: var(--base00);
		line-height: 1.5;
	}

	.tools-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		margin-top: 16px;
	}

	.tool-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 16px;
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		transition: border-color 150ms ease;
	}

	.tool-card:hover {
		border-color: var(--blue);
		text-decoration: none;
	}

	.tool-card strong {
		font-size: 0.875rem;
		color: var(--base1);
	}

	.tool-card span {
		font-size: 0.8rem;
		color: var(--base00);
		line-height: 1.5;
	}

	.contact-section {
		padding-top: 24px;
		border-top: 1px solid var(--base01);
	}

	@media (max-width: 600px) {
		.product-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
