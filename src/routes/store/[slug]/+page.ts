export const prerender = true;

export function entries() {
	return [{ slug: 'type-40' }, { slug: 'type-qaz' }];
}

import { error } from '@sveltejs/kit';
import { parseProducts } from '$lib/store/parser.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	const response = await fetch('/products.txt');
	const text = await response.text();
	const products = parseProducts(text);
	const product = products.find((p) => p.slug === params.slug);

	if (!product) {
		error(404, 'Product not found');
	}

	return { product };
};
