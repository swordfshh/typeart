<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cartStore } from '$lib/stores/cart.svelte.js';
	import { authStore } from '$lib/stores/auth.svelte.js';

	let checkingOut = $state(false);
	let checkoutError = $state('');
	let stock = $state<Record<string, number>>({});
	let resendingVerification = $state(false);
	let verificationResent = $state(false);

	const needsVerification = $derived(authStore.loggedIn && !authStore.user?.email_verified);

	async function handleResendVerification() {
		resendingVerification = true;
		verificationResent = false;
		try {
			const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
			if (res.ok) verificationResent = true;
		} catch {}
		resendingVerification = false;
	}

	onMount(() => {
		cartStore.hydrate();
		fetch('/api/stock')
			.then((r) => r.json())
			.then((data) => { stock = data; })
			.catch(() => {});
	});

	// Aggregate cart quantities per slug and check against stock
	let stockIssues = $derived.by(() => {
		const qtyBySlug = new Map<string, number>();
		for (const item of cartStore.items) {
			qtyBySlug.set(item.productSlug, (qtyBySlug.get(item.productSlug) ?? 0) + item.quantity);
		}
		const issues: Record<string, { requested: number; available: number }> = {};
		for (const [slug, qty] of qtyBySlug) {
			const available = stock[slug] ?? Infinity;
			if (qty > available) {
				issues[slug] = { requested: qty, available };
			}
		}
		return issues;
	});
	let hasStockIssues = $derived(Object.keys(stockIssues).length > 0);

	function itemTotal(item: (typeof cartStore.items)[0]): number {
		return (item.basePrice + (item.colorPrice ?? 0) + item.stabilizer.price + (item.wristRest ? item.wristRestPrice : 0)) * item.quantity;
	}

	async function handleCheckout() {
		if (!authStore.loggedIn) {
			goto('/login');
			return;
		}

		checkingOut = true;
		checkoutError = '';

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: cartStore.items })
			});
			const data = await res.json();

			if (!res.ok) {
				checkoutError = data.error || 'Checkout failed';
				return;
			}

			window.location.href = data.url;
		} catch {
			checkoutError = 'Network error. Please try again.';
		} finally {
			checkingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Cart — TypeArt</title>
</svelte:head>

<div class="cart-page">
	<h1>Cart</h1>

	{#if cartStore.items.length === 0}
		<div class="empty">
			<p>Your cart is empty.</p>
			<a href="/store" class="continue-link">Browse the store &rarr;</a>
		</div>
	{:else}
		<div class="cart-items">
			{#each cartStore.items as item (item.id)}
				<div class="cart-item">
					<picture>
						<source srcset="/images/products/{item.productSlug}/1.webp" type="image/webp" />
						<img
							class="item-thumb"
							src="/images/products/{item.productSlug}/1.jpg"
							alt={item.productName}
						/>
					</picture>
					<div class="item-details">
						<span class="item-name">{item.productName}</span>
						<span class="item-variants">
							{item.color} &middot; {item.stabilizer.name}
							{#if item.wristRest} &middot; Wrist rest{/if}
						</span>
					</div>
					<div class="item-qty">
						<button class="qty-btn" onclick={() => cartStore.updateQuantity(item.id, item.quantity - 1)}>-</button>
						<span class="qty-value">{item.quantity}</span>
						<button class="qty-btn" onclick={() => cartStore.updateQuantity(item.id, item.quantity + 1)}>+</button>
					</div>
					<span class="item-total">
						${itemTotal(item).toFixed(2)}
						{#if stockIssues[item.productSlug]}
							<span class="stock-warn">
								Only {stockIssues[item.productSlug].available} available
							</span>
						{/if}
					</span>
					<button class="remove-btn" onclick={() => cartStore.removeItem(item.id)} aria-label="Remove">
						&times;
					</button>
				</div>
			{/each}
		</div>

		{#if needsVerification}
			<div class="verify-banner">
				<p>Verify your email to checkout.
					{#if verificationResent}
						<span class="verify-sent">Sent! Check your inbox.</span>
					{:else}
						<button class="resend-link" onclick={handleResendVerification} disabled={resendingVerification}>
							{resendingVerification ? 'Sending...' : 'Resend verification email'}
						</button>
					{/if}
				</p>
			</div>
		{/if}

		<div class="cart-footer">
			<div class="cart-total">
				<span>Total</span>
				<span class="total-value">${cartStore.totalPrice.toFixed(2)}</span>
			</div>
			<div class="cart-actions">
				<a href="/store" class="continue-link">Continue Shopping</a>
				<button class="checkout-btn" onclick={handleCheckout} disabled={checkingOut || hasStockIssues || needsVerification}>
					{checkingOut ? 'Redirecting...' : 'Checkout'}
				</button>
			</div>
			{#if checkoutError}
				<p class="checkout-error">{checkoutError}</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.cart-page {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	.cart-page h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		margin-bottom: 32px;
	}

	.empty {
		text-align: center;
		padding: 48px 0;
	}

	.empty p {
		font-size: 1rem;
		color: var(--base00);
		margin-bottom: 16px;
	}

	.continue-link {
		font-size: 0.875rem;
		color: var(--blue);
		transition: color 100ms ease;
	}

	.continue-link:hover {
		color: var(--base1);
		text-decoration: none;
	}

	.cart-items {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background-color: var(--base01);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.cart-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background-color: var(--base02);
	}

	.item-thumb {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.item-details {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--base1);
	}

	.item-variants {
		font-size: 0.75rem;
		color: var(--base00);
		margin-top: 2px;
	}

	.item-qty {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.qty-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background-color: var(--base03);
		color: var(--base0);
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-family: inherit;
		cursor: pointer;
		transition: border-color 100ms ease;
	}

	.qty-btn:hover {
		border-color: var(--base0);
	}

	.qty-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--base1);
		min-width: 20px;
		text-align: center;
	}

	.item-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--green);
		min-width: 70px;
		text-align: right;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: none;
		color: var(--base00);
		font-size: 1.25rem;
		cursor: pointer;
		transition: color 100ms ease;
		padding: 0;
	}

	.remove-btn:hover {
		color: var(--red);
	}

	.cart-footer {
		margin-top: 24px;
	}

	.cart-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		border-top: 1px solid var(--base01);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--base1);
	}

	.total-value {
		color: var(--green);
		font-size: 1.25rem;
	}

	.cart-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 16px;
	}

	.checkout-btn {
		padding: 10px 24px;
		background-color: var(--green);
		color: var(--base02);
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 100ms ease;
	}

	.checkout-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.checkout-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.checkout-error {
		margin-top: 12px;
		font-size: 0.85rem;
		color: var(--red);
		text-align: right;
	}

	.verify-banner {
		margin-top: 16px;
		padding: 12px 16px;
		background: color-mix(in srgb, var(--yellow) 15%, transparent);
		border: 1px solid var(--yellow);
		border-radius: var(--radius-md);
	}

	.verify-banner p {
		font-size: 0.85rem;
		color: var(--base1);
		font-weight: 500;
	}

	.resend-link {
		background: none;
		border: none;
		color: var(--blue);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		text-decoration: underline;
	}

	.resend-link:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.verify-sent {
		color: var(--green);
		font-weight: 600;
	}

	.stock-warn {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--red);
	}
</style>
