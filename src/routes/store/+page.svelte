<script lang="ts">
	import ProductCard from '../../components/ProductCard.svelte';

	let { data } = $props();
</script>

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
