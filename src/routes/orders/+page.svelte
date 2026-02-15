<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte.js';

	interface OrderSummary {
		id: string;
		status: string;
		total_cents: number;
		item_count: number;
		created_at: string;
	}

	let orders: OrderSummary[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		if (!authStore.loggedIn) {
			goto('/login');
			return;
		}

		try {
			const res = await fetch('/api/orders');
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Failed to load orders';
				return;
			}
			orders = data.orders;
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
			year: 'numeric'
		});
	}

	function statusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="orders-page">
	<h1>Orders</h1>

	{#if loading}
		<p class="loading">Loading orders...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if orders.length === 0}
		<div class="empty">
			<p>No orders yet.</p>
			<a href="/store" class="store-link">Browse the store &rarr;</a>
		</div>
	{:else}
		<div class="order-list">
			{#each orders as order (order.id)}
				<a href="/orders/{order.id}" class="order-row">
					<div class="order-info">
						<span class="order-date">{formatDate(order.created_at)}</span>
						<span class="order-id">{order.id.slice(0, 8)}</span>
					</div>
					<span class="order-status" data-status={order.status}>{statusLabel(order.status)}</span>
					<span class="order-items">{order.item_count} {order.item_count === 1 ? 'item' : 'items'}</span>
					<span class="order-total">${(order.total_cents / 100).toFixed(2)}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.orders-page {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	.orders-page h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		margin-bottom: 32px;
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

	.empty {
		text-align: center;
		padding: 48px 0;
	}

	.empty p {
		font-size: 1rem;
		color: var(--base00);
		margin-bottom: 16px;
	}

	.store-link {
		font-size: 0.875rem;
		color: var(--blue);
		transition: color 100ms ease;
	}

	.store-link:hover {
		color: var(--base1);
		text-decoration: none;
	}

	.order-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background-color: var(--base01);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.order-row {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background-color: var(--base02);
		transition: background-color 100ms ease;
		text-decoration: none;
		color: inherit;
	}

	.order-row:hover {
		background-color: var(--base03);
		text-decoration: none;
	}

	.order-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.order-date {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--base1);
	}

	.order-id {
		font-size: 0.75rem;
		color: var(--base00);
		font-family: 'Courier Prime', monospace;
		margin-top: 2px;
	}

	.order-status {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 3px 10px;
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

	.order-items {
		font-size: 0.85rem;
		color: var(--base00);
		min-width: 60px;
		text-align: right;
	}

	.order-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--green);
		min-width: 80px;
		text-align: right;
	}
</style>
