<svelte:head>
	<title>Privacy Policy — TypeArt</title>
</svelte:head>

<div class="legal-page">
	<h1>Privacy Policy</h1>
	<p class="updated">Last updated: February 2026</p>

	<h2>What We Collect</h2>
	<p>When you create an account, we store your username, email address, and a securely hashed version of your password. We never store your password in plain text.</p>

	<h2>Typing Scores</h2>
	<p>When you submit a typing test score, we store your WPM, accuracy, and test parameters. Scores submitted to the leaderboard are publicly visible alongside your username.</p>

	<h2>Orders</h2>
	<p>When you place an order, we store your selected products, variants, quantities, and order total. Payment information is handled by our payment processor and is never stored on our servers.</p>

	<h2>Cookies</h2>
	<p>We use a single session cookie to keep you logged in. We do not use tracking cookies or third-party analytics. Your theme preference and cart contents are stored in your browser's local storage.</p>

	<h2>Keyboard Data</h2>
	<p>The keymap editor communicates directly between your browser and your keyboard over WebHID. No keyboard data is sent to our servers.</p>

	<h2>Contact</h2>
	<p>Questions about your data? Email <a href="mailto:hello@typeart.co">hello@typeart.co</a>.</p>
</div>

<style>
	.legal-page {
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

	.updated {
		font-size: 0.8rem;
		color: var(--base00);
		margin-bottom: 32px;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--base1);
		margin: 24px 0 8px;
	}

	p {
		font-size: 0.875rem;
		color: var(--base0);
		line-height: 1.6;
	}
</style>
