<script lang="ts">
	import { onMount } from 'svelte';
	import { cartStore } from '$lib/stores/cart.svelte.js';

	onMount(() => {
		cartStore.hydrate();
	});

	function itemTotal(item: (typeof cartStore.items)[0]): number {
		return (item.basePrice + item.stabilizer.price + (item.wristRest ? item.wristRestPrice : 0)) * item.quantity;
	}
</script>

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
					<div class="item-color" style:background-color={
						item.color === 'Slate Black' ? '#2d3436' :
						item.color === 'Arctic White' ? '#dfe6e9' :
						item.color === 'Navy Blue' ? '#268bd2' :
						item.color === 'Forest Green' ? '#859900' :
						'var(--base01)'
					}></div>
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
					<span class="item-total">${itemTotal(item).toFixed(2)}</span>
					<button class="remove-btn" onclick={() => cartStore.removeItem(item.id)} aria-label="Remove">
						&times;
					</button>
				</div>
			{/each}
		</div>

		<div class="cart-footer">
			<div class="cart-total">
				<span>Total</span>
				<span class="total-value">${cartStore.totalPrice.toFixed(2)}</span>
			</div>
			<div class="cart-actions">
				<a href="/store" class="continue-link">Continue Shopping</a>
				<button class="checkout-btn" disabled>Checkout coming soon</button>
			</div>
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

	.item-color {
		width: 32px;
		height: 32px;
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
		background-color: var(--base01);
		color: var(--base00);
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: inherit;
		cursor: not-allowed;
	}
</style>
