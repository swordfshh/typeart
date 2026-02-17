<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth.svelte.js';

	interface OrderItem {
		id: string;
		product_slug: string;
		product_name: string;
		base_price_cents: number;
		color: string;
		color_surcharge_cents: number;
		stabilizer_name: string;
		stabilizer_price_cents: number;
		wrist_rest: number;
		wrist_rest_price_cents: number;
		quantity: number;
	}

	interface ShippingAddress {
		name: string;
		line1: string;
		line2: string | null;
		city: string;
		state: string;
		postalCode: string;
		country: string;
	}

	interface Order {
		id: string;
		status: string;
		total_cents: number;
		created_at: string;
		tracking_number: string | null;
		tracking_carrier: string | null;
		shipping: ShippingAddress | null;
		items: OrderItem[];
	}

	let order: Order | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		if (!authStore.loggedIn) {
			goto('/login');
			return;
		}

		try {
			const res = await fetch(`/api/orders/${page.params.id}`);
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Failed to load order';
				return;
			}
			order = data.order;
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	});

	function formatDate(iso: string): string {
		return new Date(iso + 'Z').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function itemLineCents(item: OrderItem): number {
		const unit = item.base_price_cents + (item.color_surcharge_cents ?? 0) +
			item.stabilizer_price_cents + (item.wrist_rest ? item.wrist_rest_price_cents : 0);
		return unit * item.quantity;
	}

	function cents(c: number): string {
		return (c / 100).toFixed(2);
	}

	function statusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function trackingUrl(carrier: string, num: string): string | null {
		const urls: Record<string, (n: string) => string> = {
			USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
			UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
			FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`
		};
		return urls[carrier]?.(num) ?? null;
	}

	const colorMap: Record<string, string> = {
		'Galaxy Black': '#1a1a2e',
		'Void Purple': '#4a1a6b',
		'Translucent': 'rgba(200, 200, 220, 0.4)'
	};
</script>

<svelte:head>
	<title>Order #{page.params.id.slice(0, 8)} — TypeArt</title>
</svelte:head>

<div class="order-detail">
	{#if loading}
		<p class="loading">Loading order...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if order}
		<div class="order-header">
			<div>
				<h1>Order</h1>
				<span class="order-id">{order.id.slice(0, 8)}</span>
			</div>
			<span class="order-status" data-status={order.status}>{statusLabel(order.status)}</span>
		</div>
		<p class="order-date">{formatDate(order.created_at)}</p>

		<div class="items-list">
			{#each order.items as item (item.id)}
				<div class="item-row">
					<div class="item-color" style:background-color={colorMap[item.color] || 'var(--base01)'}></div>
					<div class="item-info">
						<span class="item-name">{item.product_name}</span>
						<span class="item-variants">
							{item.color} &middot; {item.stabilizer_name}
							{#if item.wrist_rest} &middot; Wrist rest{/if}
						</span>
					</div>
					<span class="item-qty">&times;{item.quantity}</span>
					<span class="item-total">${cents(itemLineCents(item))}</span>
				</div>
			{/each}
		</div>

		{#if order.shipping}
			<div class="shipping-section">
				<h3>Ship to</h3>
				<p class="shipping-address">
					{order.shipping.name}<br>
					{order.shipping.line1}
					{#if order.shipping.line2}<br>{order.shipping.line2}{/if}<br>
					{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}
				</p>
			</div>
		{/if}

		{#if order.tracking_number}
			{@const tUrl = trackingUrl(order.tracking_carrier || '', order.tracking_number)}
			<div class="tracking-section">
				<h3>Tracking</h3>
				<p class="tracking-info">
					{order.tracking_carrier}:
					{#if tUrl}
						<a href={tUrl} target="_blank" rel="noopener" class="tracking-link">{order.tracking_number}</a>
					{:else}
						<span class="tracking-num">{order.tracking_number}</span>
					{/if}
				</p>
			</div>
		{/if}

		<div class="order-footer">
			<span>Total</span>
			<span class="total-value">${cents(order.total_cents)}</span>
		</div>

		<a href="/orders" class="back-link">&larr; All orders</a>
	{/if}
</div>

<style>
	.order-detail {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	.loading, .error {
		font-size: 0.9rem;
		color: var(--base00);
		text-align: center;
		padding: 48px 0;
	}

	.error {
		color: var(--red);
	}

	.order-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.order-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		display: inline;
	}

	.order-id {
		font-size: 1rem;
		color: var(--base00);
		font-family: 'Courier Prime', monospace;
		margin-left: 8px;
	}

	.order-status {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		background-color: var(--base03);
		color: var(--base0);
	}

	.order-status[data-status="pending"] {
		background-color: color-mix(in srgb, var(--yellow) 20%, transparent);
		color: var(--yellow);
	}

	.order-status[data-status="confirmed"] {
		background-color: color-mix(in srgb, var(--green) 20%, transparent);
		color: var(--green);
	}

	.order-status[data-status="shipped"] {
		background-color: color-mix(in srgb, var(--blue) 20%, transparent);
		color: var(--blue);
	}

	.order-status[data-status="delivered"] {
		background-color: color-mix(in srgb, var(--cyan) 20%, transparent);
		color: var(--cyan);
	}

	.order-date {
		font-size: 0.85rem;
		color: var(--base00);
		margin-bottom: 32px;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background-color: var(--base01);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.item-row {
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

	.item-info {
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
		font-size: 0.85rem;
		color: var(--base00);
		min-width: 30px;
		text-align: right;
	}

	.item-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--green);
		min-width: 70px;
		text-align: right;
	}

	.shipping-section {
		margin-top: 24px;
		padding: 16px;
		background-color: var(--base02);
		border-radius: var(--radius-lg);
	}

	.shipping-section h3 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--base00);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
	}

	.shipping-address {
		font-size: 0.875rem;
		color: var(--base0);
		line-height: 1.5;
	}

	.tracking-section {
		margin-top: 24px;
		padding: 16px;
		background-color: var(--base02);
		border-radius: var(--radius-lg);
	}

	.tracking-section h3 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--base00);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
	}

	.tracking-info {
		font-size: 0.875rem;
		color: var(--base0);
	}

	.tracking-link {
		color: var(--blue);
		font-family: 'Courier Prime', monospace;
	}

	.tracking-num {
		font-family: 'Courier Prime', monospace;
	}

	.order-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		margin-top: 24px;
		border-top: 1px solid var(--base01);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--base1);
	}

	.total-value {
		color: var(--green);
		font-size: 1.25rem;
	}

	.back-link {
		display: inline-block;
		margin-top: 24px;
		font-size: 0.875rem;
		color: var(--blue);
		transition: color 100ms ease;
	}

	.back-link:hover {
		color: var(--base1);
		text-decoration: none;
	}
</style>
