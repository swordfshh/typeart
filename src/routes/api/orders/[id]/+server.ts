import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrder } from '$lib/server/orders.js';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const order = getOrder(locals.user.id, params.id);
	if (!order) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	return json({ order });
};
