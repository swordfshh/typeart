<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let now = $state(new Date());

	$effect(() => {
		document.documentElement.setAttribute('data-theme', 'miami-nights');
	});

	onMount(() => {
		const dataInterval = setInterval(() => invalidateAll(), 30_000);
		const clockInterval = setInterval(() => {
			now = new Date();
		}, 1_000);
		return () => {
			clearInterval(dataInterval);
			clearInterval(clockInterval);
		};
	});

	function fmtCents(cents: number): string {
		if (cents >= 1_000_00) {
			return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
		}
		return '$' + (cents / 100).toFixed(2);
	}

	function fmtDelta(cents: number): string {
		if (cents === 0) return '$0';
		return '+' + fmtCents(cents);
	}

	function relTime(dateStr: string): string {
		const date = new Date(dateStr + 'Z');
		const diff = (now.getTime() - date.getTime()) / 1000;
		if (diff < 60) return 'just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	}

	function shortId(id: string): string {
		return id.substring(0, 8);
	}

	const clock = $derived(
		now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
	);
	const dateStr = $derived(
		now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
	);

	const maxProductQty = $derived(
		data.popularProducts.length > 0
			? Math.max(...data.popularProducts.map((p) => p.total_qty))
			: 1
	);
</script>

<svelte:head>
	<title>TypeArt Display</title>
</svelte:head>

<div class="dashboard">
	<header class="dash-header">
		<div class="logo">
			<span class="r1">T</span><span class="r2">y</span><span class="r3">p</span><span
				class="r4">e</span
			><span class="r5">A</span><span class="r6">r</span><span class="r7">t</span>
		</div>
		<div class="header-right">
			<span class="live-dot"></span>
			<span class="date">{dateStr}</span>
			<span class="clock">{clock}</span>
		</div>
	</header>

	<div class="stats-row">
		<div class="stat-card revenue">
			<span class="stat-label">Revenue</span>
			<span class="stat-value">{fmtCents(data.stats.total_revenue_cents)}</span>
			<span class="stat-delta">{fmtDelta(data.stats.revenue_today_cents)} today</span>
		</div>
		<div class="stat-card orders">
			<span class="stat-label">Orders</span>
			<span class="stat-value">{data.stats.total_orders}</span>
			<span class="stat-delta">+{data.stats.orders_today} today</span>
		</div>
		<div class="stat-card users">
			<span class="stat-label">Users</span>
			<span class="stat-value">{data.stats.total_users}</span>
			<span class="stat-delta">+{data.stats.users_today} today</span>
		</div>
		<div class="stat-card tests">
			<span class="stat-label">Typing Tests</span>
			<span class="stat-value">{data.stats.total_tests.toLocaleString()}</span>
			<span class="stat-delta">+{data.stats.tests_today} today</span>
		</div>
	</div>

	<div class="bottom">
		<div class="recent-orders">
			<h2>Recent Orders</h2>
			{#if data.recentOrders.length === 0}
				<div class="empty">No orders yet</div>
			{:else}
				<div class="orders-list">
					{#each data.recentOrders as order}
						<div class="order-row">
							<div class="order-main">
								<span class="order-id">{shortId(order.id)}</span>
								<span class="order-items"
									>{order.items_summary || 'No items'}</span
								>
							</div>
							<div class="order-meta">
								<span class="order-total">{fmtCents(order.total_cents)}</span>
								<span class="order-status" data-status={order.status}
									>{order.status}</span
								>
								<span class="order-time">{relTime(order.created_at)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="sidebar">
			<div class="breakdown">
				<h2>Breakdown</h2>
				<div class="breakdown-grid">
					<span class="bp-label">Today</span>
					<span class="bp-orders">{data.stats.orders_today} orders</span>
					<span class="bp-revenue">{fmtCents(data.stats.revenue_today_cents)}</span>

					<span class="bp-label">7 Days</span>
					<span class="bp-orders">{data.stats.orders_week} orders</span>
					<span class="bp-revenue">{fmtCents(data.stats.revenue_week_cents)}</span>

					<span class="bp-label">30 Days</span>
					<span class="bp-orders">{data.stats.orders_month} orders</span>
					<span class="bp-revenue">{fmtCents(data.stats.revenue_month_cents)}</span>
				</div>
			</div>

			<div class="products">
				<h2>Top Products</h2>
				{#if data.popularProducts.length === 0}
					<div class="empty">No sales yet</div>
				{:else}
					<div class="product-list">
						{#each data.popularProducts as product}
							<div class="product-row">
								<span class="product-name">{product.product_name}</span>
								<div class="product-bar-wrap">
									<div
										class="product-bar"
										style="width: {(product.total_qty / maxProductQty) * 100}%"
									></div>
								</div>
								<span class="product-qty">{product.total_qty}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="typing-stats">
				<div class="typing-stat">
					<span class="ts-label">Avg WPM</span>
					<span class="ts-value">{data.stats.avg_wpm}</span>
				</div>
				<div class="typing-stat">
					<span class="ts-label">Top WPM</span>
					<span class="ts-value top">{data.stats.top_wpm}</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		height: 100vh;
		display: grid;
		grid-template-rows: auto auto 1fr;
		gap: 12px;
		padding: 14px 16px;
		background: var(--base03);
		color: var(--base0);
		overflow: hidden;
		cursor: none;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* ── Header ── */
	.dash-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 1.5rem;
		font-weight: 560;
		font-style: italic;
		letter-spacing: -0.02em;
	}

	.logo .r1 { color: #0AD2D3; }
	.logo .r2 { color: #00D4FF; }
	.logo .r3 { color: #B537F2; }
	.logo .r4 { color: #FF2E97; }
	.logo .r5 { color: #0AD2D3; }
	.logo .r6 { color: #00D4FF; }
	.logo .r7 { color: #FF2E97; }

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 8px var(--green);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.date {
		font-size: 1rem;
		color: var(--base00);
	}

	.clock {
		font-size: 1.1rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--base1);
	}

	/* ── Stat Cards ── */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.stat-card {
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: 12px;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-label {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--base00);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}

	.stat-delta {
		font-size: 0.85rem;
		color: var(--base00);
		font-variant-numeric: tabular-nums;
	}

	.stat-card.revenue {
		border-color: rgba(5, 255, 161, 0.25);
		box-shadow: 0 0 16px rgba(5, 255, 161, 0.08);
	}
	.stat-card.revenue .stat-value { color: var(--green); }
	.stat-card.revenue .stat-delta { color: rgba(5, 255, 161, 0.6); }

	.stat-card.orders {
		border-color: rgba(0, 212, 255, 0.25);
		box-shadow: 0 0 16px rgba(0, 212, 255, 0.08);
	}
	.stat-card.orders .stat-value { color: var(--blue); }
	.stat-card.orders .stat-delta { color: rgba(0, 212, 255, 0.6); }

	.stat-card.users {
		border-color: rgba(181, 55, 242, 0.25);
		box-shadow: 0 0 16px rgba(181, 55, 242, 0.08);
	}
	.stat-card.users .stat-value { color: var(--violet); }
	.stat-card.users .stat-delta { color: rgba(181, 55, 242, 0.6); }

	.stat-card.tests {
		border-color: rgba(10, 210, 211, 0.25);
		box-shadow: 0 0 16px rgba(10, 210, 211, 0.08);
	}
	.stat-card.tests .stat-value { color: var(--cyan); }
	.stat-card.tests .stat-delta { color: rgba(10, 210, 211, 0.6); }

	/* ── Bottom Section ── */
	.bottom {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		min-height: 0;
	}

	h2 {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--base00);
		margin-bottom: 8px;
	}

	.empty {
		font-size: 1rem;
		color: var(--base01);
		padding: 16px 0;
	}

	/* ── Recent Orders ── */
	.recent-orders {
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: 12px;
		padding: 12px 16px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.orders-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow: hidden;
	}

	.order-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--base03);
		border-radius: 8px;
		gap: 12px;
	}

	.order-main {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		flex: 1;
	}

	.order-id {
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 0.85rem;
		color: var(--base00);
		flex-shrink: 0;
	}

	.order-items {
		font-size: 0.9rem;
		color: var(--base0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.order-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.order-total {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--green);
		font-variant-numeric: tabular-nums;
	}

	.order-status {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: 6px;
		background: rgba(255, 225, 86, 0.15);
		color: var(--yellow);
	}

	.order-status[data-status='confirmed'] {
		background: rgba(0, 212, 255, 0.15);
		color: var(--blue);
	}

	.order-status[data-status='shipped'] {
		background: rgba(181, 55, 242, 0.15);
		color: var(--violet);
	}

	.order-status[data-status='delivered'] {
		background: rgba(5, 255, 161, 0.15);
		color: var(--green);
	}

	.order-status[data-status='cancelled'] {
		background: rgba(255, 51, 102, 0.15);
		color: var(--red);
	}

	.order-time {
		font-size: 0.8rem;
		color: var(--base00);
		font-variant-numeric: tabular-nums;
		min-width: 56px;
		text-align: right;
	}

	/* ── Sidebar ── */
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
	}

	.breakdown {
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: 12px;
		padding: 12px 16px;
	}

	.breakdown-grid {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 4px 16px;
		align-items: baseline;
	}

	.bp-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--base0);
	}

	.bp-orders {
		font-size: 0.85rem;
		color: var(--base00);
		font-variant-numeric: tabular-nums;
	}

	.bp-revenue {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--green);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	/* ── Top Products ── */
	.products {
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: 12px;
		padding: 12px 16px;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.product-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.product-row {
		display: grid;
		grid-template-columns: 120px 1fr auto;
		align-items: center;
		gap: 10px;
	}

	.product-name {
		font-size: 0.85rem;
		color: var(--base0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.product-bar-wrap {
		height: 6px;
		background: var(--base01);
		border-radius: 3px;
		overflow: hidden;
	}

	.product-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--cyan), var(--blue));
		border-radius: 3px;
		transition: width 300ms ease;
	}

	.product-qty {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--blue);
		font-variant-numeric: tabular-nums;
		min-width: 24px;
		text-align: right;
	}

	/* ── Typing Stats ── */
	.typing-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.typing-stat {
		background: var(--base02);
		border: 1px solid var(--base01);
		border-radius: 12px;
		padding: 10px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.ts-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--base00);
	}

	.ts-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--cyan);
		font-variant-numeric: tabular-nums;
	}

	.ts-value.top {
		color: var(--magenta);
	}
</style>
