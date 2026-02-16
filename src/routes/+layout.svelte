<script lang="ts">
	import '../app.css';
	import CartBadge from '../components/CartBadge.svelte';
	import { cartStore } from '$lib/stores/cart.svelte.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';
	import { authStore } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	const themeLabels: Record<string, string> = {
		'retro-beige': 'Retro Beige',
		'miami-nights': 'Miami Nights',
		'godspeed': 'Godspeed'
	};
	const themeLabel = $derived(themeLabels[themeStore.current]);

	$effect(() => {
		authStore.init(data.user);
	});

	let accountOpen = $state(false);
	let menuOpen = $state(false);

	function toggleAccount() {
		accountOpen = !accountOpen;
	}

	function closeAccount() {
		accountOpen = false;
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleAccountKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeAccount();
	}

	onMount(async () => {
		themeStore.hydrate();
		cartStore.hydrate();
		if (!authStore.loggedIn) {
			await authStore.fetchUser();
		}

		function handleClickOutside(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (!target.closest('.account-menu')) {
				accountOpen = false;
			}
			if (!target.closest('.mobile-menu') && !target.closest('.hamburger')) {
				menuOpen = false;
			}
		}
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="app">
	<nav class="navbar">
		<a href="/" class="logo"><span class="r1">T</span><span class="r2">y</span><span class="r3">p</span><span class="r4">e</span><span class="r5">A</span><span class="r6">r</span><span class="r7">t</span></a>
		<div class="nav-links">
			<button class="theme-btn" onclick={() => themeStore.toggle()}>{themeLabel}</button>
			<a href="/configure">Configure</a>
			<a href="/test">Test</a>
			<a href="/type">Type</a>
			<a href="/store">Store</a>
			<a href="/store/cart" class="cart-link">Cart<CartBadge count={cartStore.totalItems} /></a>
			{#if authStore.loggedIn}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="account-menu" onkeydown={handleAccountKeydown}>
					<button class="account-btn" onclick={toggleAccount}>
						{authStore.user?.username}
						<span class="account-arrow" class:open={accountOpen}>&#9662;</span>
					</button>
					{#if accountOpen}
						<div class="account-dropdown">
							<a href="/orders" class="dropdown-item" onclick={closeAccount}>Orders</a>
							<button class="dropdown-item" onclick={() => { closeAccount(); authStore.logout(); }}>Log out</button>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/login" class="auth-btn">Log in</a>
			{/if}
		</div>
		<div class="mobile-controls">
			<a href="/store/cart" class="mobile-cart">Cart<CartBadge count={cartStore.totalItems} /></a>
			<button class="hamburger" class:open={menuOpen} onclick={toggleMenu} aria-label="Menu">
				<span></span><span></span><span></span>
			</button>
		</div>
	</nav>
	{#if menuOpen}
		<div class="mobile-menu">
			<a href="/configure" onclick={closeMenu}>Configure</a>
			<a href="/test" onclick={closeMenu}>Test</a>
			<a href="/type" onclick={closeMenu}>Type</a>
			<a href="/store" onclick={closeMenu}>Store</a>
			<a href="/store/cart" onclick={closeMenu}>Cart</a>
			{#if authStore.loggedIn}
				<a href="/orders" onclick={closeMenu}>Orders</a>
				<button onclick={() => { closeMenu(); authStore.logout(); }}>Log out</button>
			{:else}
				<a href="/login" onclick={closeMenu}>Log in</a>
			{/if}
			<button class="mobile-theme-btn" onclick={() => themeStore.toggle()}>{themeLabel}</button>
		</div>
	{/if}

	<main class="content">
		{@render children()}
	</main>

	<footer class="site-footer">
		<div class="footer-inner">
			<span class="copyright">&copy; 2026 TypeArt</span>
			<nav class="footer-links">
				<a href="/privacy">Privacy</a>
				<a href="/terms">Terms</a>
				<a href="mailto:hello@typeart.co">Contact</a>
			</nav>
		</div>
	</footer>
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
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 1.25rem;
		font-weight: 560;
		font-style: italic;
		color: var(--base1);
		letter-spacing: -0.02em;
	}

	.logo .r1 { color: #c4443a; }
	.logo .r2 { color: #c86a2a; }
	.logo .r3 { color: #b8941e; }
	.logo .r4 { color: #4a8c3f; }
	.logo .r5 { color: #2e7bab; }
	.logo .r6 { color: #5b4a9e; }
	.logo .r7 { color: #8b3a8b; }

	:global([data-theme="miami-nights"]) .logo .r1 { color: #0AD2D3; }
	:global([data-theme="miami-nights"]) .logo .r2 { color: #00D4FF; }
	:global([data-theme="miami-nights"]) .logo .r3 { color: #B537F2; }
	:global([data-theme="miami-nights"]) .logo .r4 { color: #FF2E97; }
	:global([data-theme="miami-nights"]) .logo .r5 { color: #0AD2D3; }
	:global([data-theme="miami-nights"]) .logo .r6 { color: #00D4FF; }
	:global([data-theme="miami-nights"]) .logo .r7 { color: #FF2E97; }

	:global([data-theme="godspeed"]) .logo .r1 { color: #ffdb58; }
	:global([data-theme="godspeed"]) .logo .r2 { color: #e8a735; }
	:global([data-theme="godspeed"]) .logo .r3 { color: #5991ae; }
	:global([data-theme="godspeed"]) .logo .r4 { color: #ba1312; }
	:global([data-theme="godspeed"]) .logo .r5 { color: #ffdb58; }
	:global([data-theme="godspeed"]) .logo .r6 { color: #5991ae; }
	:global([data-theme="godspeed"]) .logo .r7 { color: #e8a735; }

	.logo:hover {
		text-decoration: none;
		filter: brightness(1.2);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.theme-btn {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		border: 1.5px solid transparent;
		background: linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(135deg, #0AD2D3, #B537F2, #FF2E97) border-box;
		color: var(--base0);
		transition: filter 150ms ease;
	}

	:global([data-theme="retro-beige"]) .theme-btn {
		border-width: 2px;
		background: linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(135deg, #e0453b, #e87d2a, #d4a81e, #54a648, #339cc5, #7058b8, #a8449e) border-box;
	}

	:global([data-theme="godspeed"]) .theme-btn {
		border-width: 2px;
		background: linear-gradient(var(--base02), var(--base02)) padding-box,
			linear-gradient(135deg, #ffdb58, #e8a735, #ba1312, #5991ae, #69d0a5) border-box;
	}

	.theme-btn:hover {
		filter: brightness(1.15);
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

	.cart-link {
		display: inline-flex;
		align-items: center;
	}

	.content {
		flex: 1;
		padding: 24px;
	}

	.account-menu {
		position: relative;
	}

	.account-btn {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		background: var(--base01);
		color: var(--base0);
		display: flex;
		align-items: center;
		gap: 4px;
		transition: filter 150ms ease;
	}

	.account-btn:hover {
		filter: brightness(1.1);
	}

	.account-arrow {
		font-size: 0.65rem;
		transition: transform 150ms ease;
	}

	.account-arrow.open {
		transform: rotate(180deg);
	}

	.account-dropdown {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 140px;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		z-index: 100;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 10px 16px;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--base0);
		background: none;
		border: none;
		text-align: left;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 100ms ease;
	}

	.dropdown-item:hover {
		background-color: var(--base03);
		text-decoration: none;
		color: var(--base1);
	}

	.auth-btn {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		background: var(--base01);
		color: var(--base0);
		transition: filter 150ms ease;
	}

	.auth-btn:hover {
		filter: brightness(1.1);
		text-decoration: none;
	}

	.site-footer {
		border-top: 1px solid var(--base01);
		padding: 16px 24px;
		flex-shrink: 0;
	}

	.footer-inner {
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: var(--base00);
	}

	.footer-links {
		display: flex;
		gap: 16px;
	}

	.footer-links a {
		color: var(--base00);
		font-size: 0.75rem;
	}

	.footer-links a:hover {
		color: var(--base0);
		text-decoration: none;
	}

	/* Mobile controls — hidden on desktop */
	.mobile-controls {
		display: none;
		align-items: center;
		gap: 16px;
	}

	.mobile-cart {
		display: inline-flex;
		align-items: center;
		color: var(--base0);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.mobile-cart:hover {
		color: var(--base1);
		text-decoration: none;
	}

	.hamburger {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 4px;
		width: 28px;
		height: 28px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.hamburger span {
		display: block;
		width: 20px;
		height: 2px;
		background-color: var(--base0);
		border-radius: 1px;
		transition: transform 200ms ease, opacity 200ms ease;
	}

	.hamburger.open span:nth-child(1) {
		transform: translateY(6px) rotate(45deg);
	}

	.hamburger.open span:nth-child(2) {
		opacity: 0;
	}

	.hamburger.open span:nth-child(3) {
		transform: translateY(-6px) rotate(-45deg);
	}

	.mobile-menu {
		display: none;
	}

	@media (max-width: 639px) {
		.nav-links {
			display: none !important;
		}

		.mobile-controls {
			display: flex;
		}

		.mobile-menu {
			display: flex;
			flex-direction: column;
			background-color: var(--base02);
			border-bottom: 1px solid var(--base01);
			padding: 8px 0;
		}

		.mobile-menu a,
		.mobile-menu button {
			padding: 12px 24px;
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--base0);
			background: none;
			border: none;
			text-align: left;
			font-family: inherit;
			cursor: pointer;
			transition: background-color 100ms ease;
		}

		.mobile-menu a:hover,
		.mobile-menu button:hover {
			background-color: var(--base03);
			color: var(--base1);
			text-decoration: none;
		}

		.mobile-theme-btn {
			border-top: 1px solid var(--base01);
			margin-top: 4px;
			padding-top: 12px !important;
			color: var(--base00) !important;
			font-size: 0.8rem !important;
		}

		.footer-inner {
			flex-direction: column;
			gap: 8px;
			text-align: center;
		}

		.content {
			padding: 16px;
		}
	}
</style>
