<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	interface AdminOrder {
		id: string;
		status: string;
		total_cents: number;
		item_count: number;
		created_at: string;
		username: string;
		email: string;
		shipping_name: string | null;
		shipping_city: string | null;
		shipping_state: string | null;
	}

	const TABS = ['all', 'paid', 'confirmed', 'shipped', 'delivered'] as const;

	let orders: AdminOrder[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let activeTab = $state<string>('all');

	async function fetchOrders(status?: string) {
		loading = true;
		error = '';
		try {
			const url = status && status !== 'all'
				? `/api/admin/orders?status=${status}`
				: '/api/admin/orders';
			const res = await fetch(url);
			if (res.status === 403) {
				goto('/');
				return;
			}
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
	}

	function selectTab(tab: string) {
		activeTab = tab;
		fetchOrders(tab);
	}

	onMount(() => {
		fetchOrders();
	});

	function formatDate(iso: string): string {
		return new Date(iso + 'Z').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function cents(c: number): string {
		return (c / 100).toFixed(2);
	}

	function statusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<svelte:head>
	<title>Orders — Admin — TypeArt</title>
</svelte:head>

<div class="admin-orders">
	<h1>Orders</h1>

	<div class="tabs">
		{#each TABS as tab}
			<button
				class="tab"
				class:active={activeTab === tab}
				onclick={() => selectTab(tab)}
			>
				{tab === 'all' ? 'All' : statusLabel(tab)}
			</button>
		{/each}
	</div>

	{#if loading}
		<p class="status-msg">Loading orders...</p>
	{:else if error}
		<p class="status-msg error">{error}</p>
	{:else if orders.length === 0}
		<p class="status-msg">No orders found.</p>
	{:else}
		<div class="order-list">
			{#each orders as order (order.id)}
				<a href="/admin/orders/{order.id}" class="order-row">
					<div class="order-main">
						<span class="order-id">{order.id.slice(0, 8)}</span>
						<span class="order-date">{formatDate(order.created_at)}</span>
						<span class="order-customer">{order.username}</span>
						<span class="order-items">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
						<span class="order-total">${cents(order.total_cents)}</span>
						<span class="order-status" data-status={order.status}>{statusLabel(order.status)}</span>
					</div>
					{#if order.shipping_name}
						<div class="order-shipping">
							{order.shipping_name} — {order.shipping_city}, {order.shipping_state}
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.admin-orders {
		max-width: 900px;
		margin: 0 auto;
		padding-top: 48px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		margin-bottom: 24px;
	}

	.tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 24px;
		border-bottom: 1px solid var(--base01);
		padding-bottom: 0;
	}

	.tab {
		padding: 8px 16px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--base00);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color 100ms ease, border-color 100ms ease;
		margin-bottom: -1px;
	}

	.tab:hover {
		color: var(--base0);
	}

	.tab.active {
		color: var(--base1);
		border-bottom-color: var(--blue);
	}

	.status-msg {
		font-size: 0.9rem;
		color: var(--base00);
		text-align: center;
		padding: 48px 0;
	}

	.status-msg.error {
		color: var(--red);
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
		display: block;
		padding: 14px 16px;
		background-color: var(--base02);
		transition: background-color 100ms ease;
		text-decoration: none;
		color: inherit;
	}

	.order-row:hover {
		background-color: var(--base03);
		text-decoration: none;
	}

	.order-main {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.order-id {
		font-family: 'Courier Prime', monospace;
		font-size: 0.8rem;
		color: var(--base00);
		min-width: 70px;
	}

	.order-date {
		font-size: 0.8rem;
		color: var(--base00);
		min-width: 90px;
	}

	.order-customer {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--base1);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.order-items {
		font-size: 0.8rem;
		color: var(--base00);
		min-width: 60px;
		text-align: right;
	}

	.order-total {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--green);
		min-width: 70px;
		text-align: right;
	}

	.order-status {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: var(--radius-sm);
		min-width: 80px;
		text-align: center;
		background-color: var(--base03);
		color: var(--base0);
	}

	.order-status[data-status="paid"] {
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

	.order-shipping {
		font-size: 0.75rem;
		color: var(--base00);
		margin-top: 6px;
		padding-left: 86px;
	}

	@media (max-width: 639px) {
		.order-main {
			flex-wrap: wrap;
			gap: 8px;
		}

		.order-id { min-width: auto; }
		.order-date { min-width: auto; }
		.order-items { min-width: auto; text-align: left; }
		.order-total { min-width: auto; }
		.order-shipping { padding-left: 0; }
	}
</style>
