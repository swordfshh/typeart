export const prerender = true;

import { parseProducts } from '$lib/store/parser.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch('/products.txt');
	const text = await response.text();
	const products = parseProducts(text);
	return { products };
};
