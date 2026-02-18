<svelte:head>
	<title>Privacy Policy — TypeArt</title>
	<meta name="description" content="TypeArt privacy policy: what data we collect, how we use it, and your rights." />
</svelte:head>

<div class="legal-page">
	<h1>Privacy Policy</h1>
	<p class="updated">Last updated: February 2026</p>

	<h2>What We Collect</h2>
	<p>When you create an account, we store your username, email address, and a securely hashed version of your password. We never store your password in plain text.</p>
	<p>When you place an order, we store your name, shipping address, selected products, variants, quantities, and order total.</p>

	<h2>Payment Information</h2>
	<p>Payments are processed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe</a>. Your credit card number and billing details are sent directly to Stripe and are never stored on our servers. We receive only a confirmation of payment and a transaction reference.</p>

	<h2>How We Use Your Information</h2>
	<p>We use your information to fulfill orders, send shipping notifications and order confirmations, maintain your account, and display your typing test scores on the leaderboard (if you choose to submit them). We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

	<h2>Third-Party Services</h2>
	<p>We use the following third-party services:</p>
	<ul>
		<li><strong>Stripe</strong> — payment processing</li>
		<li><strong>Resend</strong> — transactional emails (order confirmations, shipping notifications, password resets)</li>
		<li><strong>Cloudflare</strong> — DNS, CDN, and DDoS protection</li>
	</ul>
	<p>Each service has its own privacy policy governing how it handles your data.</p>

	<h2>Typing Scores</h2>
	<p>When you submit a typing test score, we store your WPM, accuracy, and test parameters. Scores submitted to the leaderboard are publicly visible alongside your username.</p>

	<h2>Cookies</h2>
	<p>We use a single session cookie to keep you logged in. We do not use tracking cookies or third-party analytics. Your theme preference and cart contents are stored in your browser's local storage.</p>

	<h2>Keyboard Data</h2>
	<p>The keymap editor communicates directly between your browser and your keyboard over WebHID. No keyboard data is sent to our servers.</p>

	<h2>Data Retention</h2>
	<p>Account data is retained as long as your account is active. Order records are retained for bookkeeping purposes. You can delete your account at any time from the <a href="/settings">settings page</a>, which permanently removes your account data, sessions, and typing scores.</p>

	<h2>Your Rights</h2>
	<p>You may request access to, correction of, or deletion of your personal data at any time by emailing us or by deleting your account from the settings page. Account deletion is permanent and cannot be undone.</p>

	<h2>Children</h2>
	<p>TypeArt is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.</p>

	<h2>Changes to This Policy</h2>
	<p>We may update this policy from time to time. The "Last updated" date at the top reflects the most recent revision. Continued use of the site after changes constitutes acceptance of the updated policy.</p>

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

	p, li {
		font-size: 0.875rem;
		color: var(--base0);
		line-height: 1.6;
	}

	ul {
		margin: 8px 0;
		padding-left: 24px;
	}

	li {
		margin-bottom: 4px;
	}
</style>
