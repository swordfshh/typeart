<script lang="ts">
	import { onMount } from 'svelte';
	import VariantSelector from '../../../components/VariantSelector.svelte';
	import { cartStore } from '$lib/stores/cart.svelte.js';
	import type { StabilizerOption } from '$lib/store/types.js';

	let { data } = $props();

	let product = $derived(data.product);
	let stabOptions = $derived(
		product.stabilizers.map(
			(s) => `${s.name}${s.price > 0 ? ` (+$${s.price.toFixed(2)})` : ''}`
		)
	);

	let selectedColor = $state(product.colors[0] ?? '');
	let selectedStabIndex = $state(0);
	let wristRest = $state(false);
	let added = $state(false);

	let selectedStab: StabilizerOption = $derived(product.stabilizers[selectedStabIndex]);

	let totalPrice: number = $derived(
		product.price +
			(selectedStab?.price ?? 0) +
			(wristRest ? product.wristRestPrice : 0)
	);

	function addToCart() {
		cartStore.addItem(product, {
			color: selectedColor,
			stabilizer: selectedStab,
			wristRest
		});
		added = true;
		setTimeout(() => (added = false), 1500);
	}

	onMount(() => {
		cartStore.hydrate();
	});
</script>

<svelte:head>
	<title>{product.name} — TypeArt</title>
</svelte:head>

<div class="product-detail">
	<a href="/store" class="back-link">&larr; Back to Store</a>

	<div class="product-layout">
		<div class="product-image">
			<div class="placeholder" style:background-color={product.placeholderColor}></div>
		</div>

		<div class="product-info">
			<h1>{product.name}</h1>
			<p class="tagline">{product.tagline}</p>
			<p class="description">{product.description}</p>

			<div class="variants">
				{#if product.colors.length > 0}
					<VariantSelector
						label="Color"
						options={product.colors}
						value={selectedColor}
						onchange={(v) => (selectedColor = v)}
					/>
				{/if}

				{#if product.stabilizers.length > 0}
					<VariantSelector
						label="Stabilizers"
						options={stabOptions}
						value={stabOptions[selectedStabIndex]}
						onchange={(v) => (selectedStabIndex = stabOptions.indexOf(v))}
					/>
				{/if}

				{#if product.wristRestPrice > 0}
					<label class="wrist-rest-toggle">
						<input type="checkbox" bind:checked={wristRest} />
						<span>Add wrist rest (+${product.wristRestPrice.toFixed(2)})</span>
					</label>
				{/if}
			</div>

			<div class="price-row">
				<span class="total-price">${totalPrice.toFixed(2)}</span>
				<button class="add-btn" onclick={addToCart} class:added>
					{added ? 'Added!' : 'Add to Cart'}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.product-detail {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 24px;
	}

	.back-link {
		display: inline-block;
		font-size: 0.875rem;
		color: var(--base0);
		margin-bottom: 24px;
		transition: color 100ms ease;
	}

	.back-link:hover {
		color: var(--base1);
		text-decoration: none;
	}

	.product-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
	}

	@media (max-width: 600px) {
		.product-layout {
			grid-template-columns: 1fr;
		}
	}

	.placeholder {
		aspect-ratio: 4 / 3;
		width: 100%;
		border-radius: var(--radius-lg);
	}

	.product-info h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.02em;
	}

	.tagline {
		margin-top: 4px;
		font-size: 0.875rem;
		color: var(--base00);
	}

	.description {
		margin-top: 12px;
		font-size: 0.875rem;
		color: var(--base0);
		line-height: 1.5;
	}

	.variants {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 24px;
	}

	.wrist-rest-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--base0);
	}

	.wrist-rest-toggle input {
		accent-color: var(--blue);
		width: 16px;
		height: 16px;
	}

	.price-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 24px;
		padding-top: 16px;
		border-top: 1px solid var(--base01);
	}

	.total-price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--green);
	}

	.add-btn {
		padding: 10px 24px;
		background-color: var(--blue);
		color: var(--on-accent);
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 100ms ease;
	}

	.add-btn:hover {
		background-color: color-mix(in srgb, var(--blue) 85%, white);
	}

	.add-btn.added {
		background-color: var(--green);
	}
</style>
