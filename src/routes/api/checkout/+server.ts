import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrder, getOrder, setStripeSessionId, OrderError } from '$lib/server/orders.js';
import { getStripe } from '$lib/server/stripe.js';
import { rateLimit } from '$lib/server/rate-limit.js';
import { isEmailVerified } from '$lib/server/auth.js';

const BASE_URL = process.env.BASE_URL || 'https://typeart.co';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	if (!isEmailVerified(locals.user.id)) {
		return json({ error: 'Please verify your email before placing an order' }, { status: 403 });
	}

	const { allowed, retryAfterMs } = rateLimit(`checkout:${locals.user.id}`, 10);
	if (!allowed) {
		return json(
			{ error: 'Too many requests. Try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	const body = await request.json();

	let orderId: string;
	try {
		orderId = createOrder(locals.user.id, body.items);
	} catch (err) {
		if (err instanceof OrderError) {
			return json({ error: err.message }, { status: 400 });
		}
		throw err;
	}

	const order = getOrder(locals.user.id, orderId)!;

	const lineItems = order.items.map((item) => ({
		price_data: {
			currency: 'usd',
			product_data: {
				name: item.product_name,
				description: [
					item.color,
					item.stabilizer_name !== 'None' ? item.stabilizer_name : null,
					item.wrist_rest ? 'Wrist rest' : null
				]
					.filter(Boolean)
					.join(' · ')
			},
			unit_amount:
				item.base_price_cents +
				(item.color_surcharge_cents ?? 0) +
				item.stabilizer_price_cents +
				(item.wrist_rest ? item.wrist_rest_price_cents : 0)
		},
		quantity: item.quantity
	}));

	const session = await getStripe().checkout.sessions.create({
		mode: 'payment',
		line_items: lineItems,
		shipping_address_collection: { allowed_countries: ['US'] },
		success_url: `${BASE_URL}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${BASE_URL}/store/cart`,
		metadata: { order_id: orderId, user_id: locals.user.id }
	});

	setStripeSessionId(orderId, session.id);

	return json({ url: session.url });
};
