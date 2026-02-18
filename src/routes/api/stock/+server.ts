import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStockAll } from '$lib/server/orders.js';

export const GET: RequestHandler = async () => {
	return json(getStockAll());
};
