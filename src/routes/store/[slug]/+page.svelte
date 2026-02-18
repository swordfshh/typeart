<script lang="ts">
	import { onMount } from 'svelte';
	import VariantSelector from '../../../components/VariantSelector.svelte';
	import { cartStore } from '$lib/stores/cart.svelte.js';
	import type { ColorOption, StabilizerOption, SpecItem } from '$lib/store/types.js';

	let { data } = $props();

	let product = $derived(data.product);
	let colorOptions = $derived(
		product.colors.map(
			(c: ColorOption) => `${c.name}${c.price > 0 ? ` (+$${c.price.toFixed(2)})` : ''}`
		)
	);
	let stabOptions = $derived(
		product.stabilizers.map(
			(s: StabilizerOption) => `${s.name}${s.price > 0 ? ` (+$${s.price.toFixed(2)})` : ''}`
		)
	);

	let selectedColorIndex = $state(0);
	let selectedStabIndex = $state(0);
	let wristRest = $state(false);
	let added = $state(false);
	let kitAcknowledged = $state(false);
	let activeImage = $state(0);
	let stock = $state<number | null>(null);

	const images = $derived(
		Array.from({ length: product.imageCount }, (_, i) => ({
			jpg: `/images/products/${product.slug}/${i + 1}.jpg`,
			webp: `/images/products/${product.slug}/${i + 1}.webp`
		}))
	);

	let selectedColor: ColorOption = $derived(product.colors[selectedColorIndex]);
	let selectedStab: StabilizerOption = $derived(product.stabilizers[selectedStabIndex]);

	let totalPrice: number = $derived(
		product.price +
			(selectedColor?.price ?? 0) +
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

	let outOfStock = $derived(stock === 0);
	let lowStock = $derived(stock !== null && stock > 0 && stock <= 3);

	onMount(() => {
		cartStore.hydrate();
		fetch('/api/stock')
			.then((r) => r.json())
			.then((data) => {
				stock = data[product.slug] ?? 0;
			})
			.catch(() => {});
	});
</script>

<svelte:head>
	<title>{product.name} — TypeArt</title>
	<meta name="description" content="{product.tagline}. Free shipping on all orders." />
	<meta property="og:title" content="{product.name} — TypeArt" />
	<meta property="og:description" content="{product.tagline}. Free shipping." />
	<meta property="og:type" content="product" />
	<meta property="og:url" content="https://typeart.co/store/{product.slug}" />
	<meta property="og:image" content="https://typeart.co/images/products/{product.slug}/1.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Product",
		"name": product.name,
		"description": product.description,
		"image": `https://typeart.co/images/products/${product.slug}/1.jpg`,
		"url": `https://typeart.co/store/${product.slug}`,
		"brand": {
			"@type": "Brand",
			"name": "TypeArt"
		},
		"offers": {
			"@type": "Offer",
			"price": product.price.toFixed(2),
			"priceCurrency": "USD",
			"availability": outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
			"url": `https://typeart.co/store/${product.slug}`,
			"shippingDetails": {
				"@type": "OfferShippingDetails",
				"shippingRate": {
					"@type": "MonetaryAmount",
					"value": "0",
					"currency": "USD"
				},
				"shippingDestination": {
					"@type": "DefinedRegion",
					"addressCountry": "US"
				}
			}
		},
		...(product.specs.length > 0 ? { "additionalProperty": product.specs.map((s: SpecItem) => ({
			"@type": "PropertyValue",
			"name": s.label,
			"value": s.value
		})) } : {})
	})}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": [
			{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://typeart.co" },
			{ "@type": "ListItem", "position": 2, "name": "Store", "item": "https://typeart.co/store" },
			{ "@type": "ListItem", "position": 3, "name": product.name, "item": `https://typeart.co/store/${product.slug}` }
		]
	})}</script>`}
</svelte:head>

<div class="product-detail">
	<a href="/store" class="back-link">&larr; Back to Store</a>

	<div class="product-layout">
		<div class="product-image">
			{#if images.length > 0}
				<picture>
					<source srcset={images[activeImage].webp} type="image/webp" />
					<img
						src={images[activeImage].jpg}
						alt="{product.name} compact mechanical keyboard kit — {product.tagline}"
						class="main-image"
					/>
				</picture>
				{#if images.length > 1}
					<div class="thumbnails">
						{#each images as img, i}
							<button
								class="thumb"
								class:active={activeImage === i}
								onclick={() => (activeImage = i)}
							>
								<picture>
									<source srcset={img.webp} type="image/webp" />
									<img src={img.jpg} alt="{product.name} mechanical keyboard kit — view {i + 1}" loading="lazy" />
								</picture>
							</button>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="placeholder" style:background-color={product.placeholderColor}></div>
			{/if}
		</div>

		<div class="product-info">
			<h1>{product.name}</h1>
			<p class="tagline">{product.tagline}</p>
			<p class="description">{product.description}</p>

			<div class="variants">
				{#if product.colors.length > 0}
					<VariantSelector
						label="Color"
						options={colorOptions}
						value={colorOptions[selectedColorIndex]}
						onchange={(v) => (selectedColorIndex = colorOptions.indexOf(v))}
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
				<label class="kit-acknowledge">
					<input type="checkbox" bind:checked={kitAcknowledged} />
					<span>This is a kit — I'll provide my own switches and keycaps</span>
				</label>
			</div>

			<div class="price-row">
				<div class="price-col">
					<span class="total-price">${totalPrice.toFixed(2)}</span>
					<span class="free-ship">Free shipping</span>
					{#if lowStock}
						<span class="low-stock">Only {stock} left</span>
					{/if}
				</div>
				{#if outOfStock}
					<button class="add-btn out-of-stock" disabled>Out of Stock</button>
				{:else}
					<button class="add-btn" onclick={addToCart} class:added disabled={!kitAcknowledged}>
						{added ? 'Added!' : 'Add to Cart'}
					</button>
				{/if}
			</div>

			<p class="configure-link">After building, <a href="/configure">configure your keymap</a> live in the browser. <a href="/about">Learn more</a> about what's in the kit.</p>
		</div>
	</div>

	{#if product.specs.length > 0}
		<div class="specs-section">
			<h2>Specifications</h2>
			<table class="specs-table">
				<tbody>
					{#each product.specs as spec}
						<tr>
							<td class="spec-label">{spec.label}</td>
							<td class="spec-value">{spec.value}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
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

	.main-image {
		aspect-ratio: 4 / 3;
		width: 100%;
		object-fit: cover;
		border-radius: var(--radius-lg);
		display: block;
	}

	.thumbnails {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.thumb {
		flex: 1;
		padding: 0;
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		overflow: hidden;
		opacity: 0.5;
		transition: opacity 150ms ease, border-color 150ms ease;
		cursor: pointer;
		background: none;
	}

	.thumb:hover {
		opacity: 0.8;
	}

	.thumb.active {
		opacity: 1;
		border-color: var(--blue);
	}

	.thumb img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		display: block;
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

	.wrist-rest-toggle input,
	.kit-acknowledge input {
		accent-color: var(--blue);
		width: 16px;
		height: 16px;
	}

	.kit-acknowledge {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		cursor: pointer;
		font-size: 0.8rem;
		color: var(--base00);
		line-height: 1.4;
		margin-top: 4px;
	}

	.kit-acknowledge input {
		margin-top: 1px;
		flex-shrink: 0;
	}

	.price-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 24px;
		padding-top: 16px;
		border-top: 1px solid var(--base01);
	}

	.price-col {
		display: flex;
		flex-direction: column;
	}

	.total-price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--green);
	}

	.free-ship {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--base00);
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

	.add-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.add-btn:disabled:hover {
		background-color: var(--blue);
	}

	.add-btn.added {
		background-color: var(--green);
	}

	.add-btn.out-of-stock {
		background-color: var(--base01);
		color: var(--base00);
		opacity: 1;
	}

	.low-stock {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--yellow);
	}

	.configure-link {
		margin-top: 16px;
		font-size: 0.8rem;
		color: var(--base00);
		line-height: 1.5;
	}

	.configure-link a {
		color: var(--blue);
	}

	.specs-section {
		margin-top: 40px;
		padding-top: 24px;
		border-top: 1px solid var(--base01);
	}

	.specs-section h2 {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.01em;
		margin-bottom: 16px;
	}

	.specs-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.specs-table tr {
		border-bottom: 1px solid var(--base01);
	}

	.specs-table tr:last-child {
		border-bottom: none;
	}

	.spec-label {
		color: var(--base00);
		padding: 8px 16px 8px 0;
		white-space: nowrap;
		width: 1%;
		font-weight: 500;
	}

	.spec-value {
		color: var(--base0);
		padding: 8px 0;
	}
</style>
