<script lang="ts">
	import ProductCard from '../../components/ProductCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Store — TypeArt</title>
	<meta name="description" content="TypeArt keyboard kits — compact mechanical keyboards with gasket mount, hot-swap sockets, and QMK/VIA support. Free shipping." />
	<meta property="og:title" content="Store — TypeArt" />
	<meta property="og:description" content="Compact mechanical keyboard kits with gasket mount, hot-swap sockets, and QMK/VIA support. Free shipping." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://typeart.co/store" />
	<meta property="og:image" content="https://typeart.co/images/products/{data.products[0]?.slug}/1.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "ItemList",
		"name": "TypeArt Keyboard Kits",
		"url": "https://typeart.co/store",
		"itemListElement": data.products.map((p, i) => ({
			"@type": "ListItem",
			"position": i + 1,
			"url": `https://typeart.co/store/${p.slug}`
		}))
	})}</script>`}
</svelte:head>

<div class="store">
	<div class="store-header">
		<h1>Store</h1>
		<p class="store-subtitle">Keyboard kits, built for focus</p>
	</div>

	<div class="product-grid">
		{#each data.products as product}
			<ProductCard
				name={product.name}
				slug={product.slug}
				tagline={product.tagline}
				price={product.price}
				placeholderColor={product.placeholderColor}
				imageCount={product.imageCount}
			/>
		{/each}
	</div>
</div>

<style>
	.store {
		max-width: 720px;
		margin: 0 auto;
		padding-top: 48px;
	}

	.store-header {
		text-align: center;
		margin-bottom: 48px;
	}

	.store-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--base1);
		letter-spacing: -0.03em;
	}

	.store-subtitle {
		margin-top: 8px;
		font-size: 1rem;
		color: var(--base00);
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}
</style>
