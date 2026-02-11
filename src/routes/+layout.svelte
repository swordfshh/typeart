<script lang="ts">
	import '../app.css';
	import CartBadge from '../components/CartBadge.svelte';
	import { cartStore } from '$lib/stores/cart.svelte.js';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		cartStore.hydrate();
	});
</script>

<div class="app">
	<nav class="navbar">
		<a href="/" class="logo"><span class="r1">T</span><span class="r2">y</span><span class="r3">p</span><span class="r4">e</span><span class="r5">A</span><span class="r6">r</span><span class="r7">t</span></a>
		<div class="nav-links">
			<a href="/configure">Configure</a>
			<a href="/test">Test</a>
			<a href="/store">Store</a>
			<a href="/store/cart" class="cart-link">Cart<CartBadge count={cartStore.totalItems} /></a>
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

	.logo:hover {
		text-decoration: none;
		filter: brightness(1.2);
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

	.cart-link {
		display: inline-flex;
		align-items: center;
	}

	.content {
		flex: 1;
		padding: 24px;
	}
</style>
