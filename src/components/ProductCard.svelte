<script lang="ts">
	interface Props {
		name: string;
		slug: string;
		tagline: string;
		price: number;
		placeholderColor: string;
	}

	let { name, slug, tagline, price, placeholderColor }: Props = $props();
</script>

<a href="/store/{slug}" class="product-card">
	<div class="placeholder" style:background-color={placeholderColor}></div>
	<div class="info">
		<h3 class="product-name">{name}</h3>
		<p class="product-tagline">{tagline}</p>
		<p class="product-price">${price.toFixed(2)}</p>
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
</style>
