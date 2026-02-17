<script lang="ts">
	import { onMount } from 'svelte';
	import { cartStore } from '$lib/stores/cart.svelte.js';

	let { data } = $props();

	onMount(() => {
		cartStore.clear();
	});
</script>

<svelte:head>
	<title>Order Confirmed — TypeArt</title>
</svelte:head>

<div class="success-page">
	<div class="check-icon">&#10003;</div>
	<h1>Order confirmed</h1>
	<p>Thank you for your purchase. You'll receive a confirmation email shortly.</p>
	<div class="actions">
		{#if data.orderId}
			<a href="/orders/{data.orderId}" class="view-order">View your order</a>
		{:else}
			<a href="/orders" class="view-order">View your orders</a>
		{/if}
		<a href="/store" class="continue-link">Continue shopping</a>
	</div>
</div>

<style>
	.success-page {
		max-width: 480px;
		margin: 0 auto;
		padding-top: 80px;
		text-align: center;
	}

	.check-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background-color: color-mix(in srgb, var(--green) 20%, transparent);
		color: var(--green);
		font-size: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 24px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
		margin-bottom: 12px;
	}

	p {
		font-size: 0.95rem;
		color: var(--base00);
		margin-bottom: 32px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}

	.view-order {
		display: inline-block;
		padding: 10px 24px;
		background-color: var(--green);
		color: var(--base02);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
		transition: opacity 100ms ease;
	}

	.view-order:hover {
		opacity: 0.9;
		text-decoration: none;
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
</style>
