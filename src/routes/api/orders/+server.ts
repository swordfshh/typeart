import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrder, getOrder, getOrders, OrderError } from '$lib/server/orders.js';
import { rateLimit } from '$lib/server/rate-limit.js';
import { sendOrderConfirmationEmail, type OrderEmailItem } from '$lib/server/email.js';

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

		// Send order confirmation email (fire-and-forget)
		try {
			const order = getOrder(locals.user.id, id);
			if (order && locals.user.email) {
				const emailItems: OrderEmailItem[] = order.items.map((item) => ({
					productName: item.product_name,
					color: item.color,
					stabilizerName: item.stabilizer_name,
					wristRest: item.wrist_rest === 1,
					quantity: item.quantity,
					lineTotalCents:
						(item.base_price_cents +
							(item.color_surcharge_cents ?? 0) +
							item.stabilizer_price_cents +
							(item.wrist_rest ? item.wrist_rest_price_cents : 0)) *
						item.quantity
				}));
				sendOrderConfirmationEmail(locals.user.email, id, emailItems, order.total_cents);
			}
		} catch (emailErr) {
			console.error('Order confirmation email failed:', emailErr);
		}

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
