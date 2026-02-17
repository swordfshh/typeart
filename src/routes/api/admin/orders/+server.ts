import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdmin } from '$lib/server/auth.js';
import { getAllOrders } from '$lib/server/orders.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !isAdmin(locals.user.id)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const status = url.searchParams.get('status') || undefined;
	const orders = getAllOrders(status);
	return json({ orders });
};
