<script lang="ts">
	interface Props {
		name: string;
		slug: string;
		tagline: string;
		price: number;
		placeholderColor: string;
		imageCount: number;
	}

	let { name, slug, tagline, price, placeholderColor, imageCount }: Props = $props();
</script>

<a href="/store/{slug}" class="product-card">
	{#if imageCount > 0}
		<img
			src="/images/products/{slug}/1.jpg"
			alt={name}
			class="product-image"
			loading="lazy"
		/>
	{:else}
		<div class="placeholder" style:background-color={placeholderColor}></div>
	{/if}
	<div class="info">
		<h3 class="product-name">{name}</h3>
		<p class="product-tagline">{tagline}</p>
		<p class="product-price">${price.toFixed(2)} <span class="free-ship">Free shipping</span></p>
	</div>
</a>

<style>
	.product-card {
		display: block;
		background-color: var(--base02);
		border: 1px solid var(--base01);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: border-color 100ms ease, box-shadow 100ms ease;
	}

	.product-card:hover {
		text-decoration: none;
		border-color: var(--blue);
		box-shadow: var(--shadow-md);
	}

	.product-image {
		aspect-ratio: 4 / 3;
		width: 100%;
		object-fit: cover;
		display: block;
	}

	.placeholder {
		aspect-ratio: 4 / 3;
		width: 100%;
	}

	.info {
		padding: 16px;
	}

	.product-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--base1);
		margin-bottom: 4px;
	}

	.product-tagline {
		font-size: 0.875rem;
		color: var(--base00);
		margin-bottom: 8px;
	}

	.product-price {
		font-size: 1rem;
		font-weight: 600;
		color: var(--green);
	}

	.free-ship {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--base00);
	}
</style>
