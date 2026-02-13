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

	onMount(async () => {
		themeStore.hydrate();
		cartStore.hydrate();
		if (!authStore.loggedIn) {
			await authStore.fetchUser();
		}
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
			<a href="/game">Game</a>
			<a href="/store">Store</a>
			<a href="/store/cart" class="cart-link">Cart<CartBadge count={cartStore.totalItems} /></a>
			{#if authStore.loggedIn}
				<span class="auth-user">{authStore.user?.username}</span>
				<button class="auth-btn" onclick={() => authStore.logout()}>Log out</button>
			{:else}
				<a href="/login" class="auth-btn">Log in</a>
			{/if}
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

	.auth-user {
		font-size: 0.85rem;
		font-weight: 600;
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
</style>
