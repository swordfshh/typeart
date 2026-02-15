import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrder, getOrders, OrderError } from '$lib/server/orders.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const { allowed, retryAfterMs } = rateLimit(`orders:${locals.user.id}`, 10);
	if (!allowed) {
		return json(
			{ error: 'Too many orders. Try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	const body = await request.json();

	try {
		const id = createOrder(locals.user.id, body.items);
		return json({ id });
	} catch (err) {
		if (err instanceof OrderError) {
			return json({ error: err.message }, { status: 400 });
		}
		throw err;
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const orders = getOrders(locals.user.id);
	return json({ orders });
};
