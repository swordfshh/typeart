<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

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
		user_id: string;
		status: string;
		total_cents: number;
		created_at: string;
		tracking_number: string | null;
		tracking_carrier: string | null;
		confirmed_at: string | null;
		shipped_at: string | null;
		delivered_at: string | null;
		shipping: ShippingAddress | null;
		items: OrderItem[];
	}

	const CARRIERS = ['USPS', 'UPS', 'FedEx', 'Other'];

	let order: Order | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let updating = $state(false);
	let updateError = $state('');
	let trackingNumber = $state('');
	let trackingCarrier = $state('USPS');
	let showShipForm = $state(false);

	async function fetchOrder() {
		try {
			const res = await fetch(`/api/admin/orders/${page.params.id}`);
			if (res.status === 403) {
				goto('/');
				return;
			}
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
	}

	onMount(fetchOrder);

	async function updateStatus(newStatus: string) {
		if (!order) return;
		updating = true;
		updateError = '';

		const body: Record<string, string> = { status: newStatus };
		if (newStatus === 'shipped') {
			body.trackingNumber = trackingNumber.trim();
			body.carrier = trackingCarrier;
		}

		try {
			const res = await fetch(`/api/admin/orders/${order.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const data = await res.json();
			if (!res.ok) {
				updateError = data.error || 'Update failed';
				return;
			}
			order = data.order;
			showShipForm = false;
			trackingNumber = '';
		} catch {
			updateError = 'Network error';
		} finally {
			updating = false;
		}
	}

	function nextStatus(current: string): string | null {
		const flow: Record<string, string> = { paid: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
		return flow[current] || null;
	}

	function nextLabel(status: string): string {
		const labels: Record<string, string> = { confirmed: 'Confirm Order', shipped: 'Mark Shipped', delivered: 'Mark Delivered' };
		return labels[status] || status;
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso + 'Z').toLocaleDateString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric',
			hour: 'numeric', minute: '2-digit'
		});
	}

	function itemLineCents(item: OrderItem): number {
		return (item.base_price_cents + (item.color_surcharge_cents ?? 0) +
			item.stabilizer_price_cents + (item.wrist_rest ? item.wrist_rest_price_cents : 0)) * item.quantity;
	}

	function cents(c: number): string {
		return (c / 100).toFixed(2);
	}

	function statusLabel(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	function trackingUrl(carrier: string, num: string): string | null {
		const urls: Record<string, (n: string) => string> = {
			USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
			UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
			FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`
		};
		return urls[carrier]?.(num) ?? null;
	}
</script>

<svelte:head>
	<title>Order #{page.params.id.slice(0, 8)} — Admin — TypeArt</title>
</svelte:head>

<div class="admin-detail">
	{#if loading}
		<p class="status-msg">Loading order...</p>
	{:else if error}
		<p class="status-msg error">{error}</p>
	{:else if order}
		<div class="order-header">
			<div>
				<h1>Order</h1>
				<span class="order-id">{order.id.slice(0, 8)}</span>
			</div>
			<span class="order-status" data-status={order.status}>{statusLabel(order.status)}</span>
		</div>
		<p class="order-date">{formatDate(order.created_at)}</p>

		<!-- Status timeline -->
		<div class="timeline">
			{#if order.confirmed_at}
				<div class="timeline-item">
					<span class="timeline-dot confirmed"></span>
					<span class="timeline-label">Confirmed</span>
					<span class="timeline-date">{formatDate(order.confirmed_at)}</span>
				</div>
			{/if}
			{#if order.shipped_at}
				<div class="timeline-item">
					<span class="timeline-dot shipped"></span>
					<span class="timeline-label">Shipped</span>
					<span class="timeline-date">{formatDate(order.shipped_at)}</span>
				</div>
			{/if}
			{#if order.delivered_at}
				<div class="timeline-item">
					<span class="timeline-dot delivered"></span>
					<span class="timeline-label">Delivered</span>
					<span class="timeline-date">{formatDate(order.delivered_at)}</span>
				</div>
			{/if}
		</div>

		<!-- Tracking info -->
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

		<!-- Items -->
		<div class="items-list">
			{#each order.items as item (item.id)}
				<div class="item-row">
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

		<!-- Shipping address -->
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

		<div class="order-footer">
			<span>Total</span>
			<span class="total-value">${cents(order.total_cents)}</span>
		</div>

		<!-- Status controls -->
		{@const next = nextStatus(order.status)}
		{#if next}
			<div class="action-section">
				{#if updateError}
					<p class="update-error">{updateError}</p>
				{/if}

				{#if next === 'shipped' && !showShipForm}
					<button class="action-btn shipped" onclick={() => (showShipForm = true)} disabled={updating}>
						{nextLabel(next)}
					</button>
				{:else if next === 'shipped' && showShipForm}
					<div class="ship-form">
						<div class="form-row">
							<label for="tracking">Tracking number</label>
							<input
								id="tracking"
								type="text"
								bind:value={trackingNumber}
								placeholder="e.g. 9400111899223100012345"
							/>
						</div>
						<div class="form-row">
							<label for="carrier">Carrier</label>
							<select id="carrier" bind:value={trackingCarrier}>
								{#each CARRIERS as c}
									<option value={c}>{c}</option>
								{/each}
							</select>
						</div>
						<div class="form-actions">
							<button
								class="action-btn shipped"
								onclick={() => updateStatus('shipped')}
								disabled={updating || !trackingNumber.trim()}
							>
								{updating ? 'Shipping...' : 'Confirm & Ship'}
							</button>
							<button class="cancel-btn" onclick={() => (showShipForm = false)} disabled={updating}>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<button
						class="action-btn {next}"
						onclick={() => updateStatus(next)}
						disabled={updating}
					>
						{updating ? 'Updating...' : nextLabel(next)}
					</button>
				{/if}
			</div>
		{/if}

		<a href="/admin/orders" class="back-link">&larr; All orders</a>
	{/if}
</div>

<style>
	.admin-detail {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	.status-msg {
		font-size: 0.9rem;
		color: var(--base00);
		text-align: center;
		padding: 48px 0;
	}

	.status-msg.error { color: var(--red); }

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

	.order-date {
		font-size: 0.85rem;
		color: var(--base00);
		margin-bottom: 24px;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 24px;
		padding: 12px 16px;
		background-color: var(--base02);
		border-radius: var(--radius-lg);
	}

	.timeline:empty {
		display: none;
	}

	.timeline-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.timeline-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.timeline-dot.confirmed { background-color: var(--green); }
	.timeline-dot.shipped { background-color: var(--blue); }
	.timeline-dot.delivered { background-color: var(--cyan); }

	.timeline-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--base0);
		min-width: 70px;
	}

	.timeline-date {
		font-size: 0.75rem;
		color: var(--base00);
	}

	.tracking-section {
		padding: 16px;
		background-color: var(--base02);
		border-radius: var(--radius-lg);
		margin-bottom: 24px;
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

	.action-section {
		margin-top: 24px;
		padding: 20px;
		background-color: var(--base02);
		border-radius: var(--radius-lg);
	}

	.update-error {
		font-size: 0.85rem;
		color: var(--red);
		margin-bottom: 12px;
	}

	.action-btn {
		padding: 10px 20px;
		font-size: 0.85rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: filter 100ms ease;
		color: #fff;
	}

	.action-btn:hover:not(:disabled) { filter: brightness(1.1); }
	.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.action-btn.confirmed { background-color: var(--green); }
	.action-btn.shipped { background-color: var(--blue); }
	.action-btn.delivered { background-color: var(--cyan); color: var(--base03); }

	.ship-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.form-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.form-row label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--base00);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-row input,
	.form-row select {
		padding: 8px 12px;
		font-size: 0.85rem;
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		background-color: var(--base03);
		color: var(--base1);
		font-family: inherit;
	}

	.form-row input:focus,
	.form-row select:focus {
		outline: none;
		border-color: var(--blue);
	}

	.form-actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}

	.cancel-btn {
		padding: 10px 20px;
		font-size: 0.85rem;
		font-weight: 600;
		border: 1px solid var(--base01);
		border-radius: var(--radius-sm);
		background: none;
		color: var(--base0);
		cursor: pointer;
		transition: background-color 100ms ease;
	}

	.cancel-btn:hover:not(:disabled) {
		background-color: var(--base03);
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
