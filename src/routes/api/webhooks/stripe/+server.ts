import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripe, STRIPE_WEBHOOK_SECRET } from '$lib/server/stripe.js';
import {
	getOrderById,
	updateOrderPayment
} from '$lib/server/orders.js';
import { sendOrderConfirmationEmail, type OrderEmailItem } from '$lib/server/email.js';
import { db } from '$lib/server/db.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const sig = request.headers.get('stripe-signature');

	if (!sig) {
		return json({ error: 'Missing signature' }, { status: 400 });
	}

	let event;
	try {
		event = getStripe().webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Stripe webhook signature verification failed:', err);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const orderId = session.metadata?.order_id;

		if (!orderId) {
			return json({ received: true });
		}

		const order = getOrderById(orderId);
		if (!order || order.status === 'paid') {
			return json({ received: true });
		}

		updateOrderPayment(orderId, 'paid', session.payment_intent as string);

		// Send confirmation email (fire-and-forget)
		try {
			const user = db
				.prepare('SELECT email FROM users WHERE id = ?')
				.get(order.user_id) as { email: string } | undefined;

			if (user?.email) {
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
				sendOrderConfirmationEmail(user.email, orderId, emailItems, order.total_cents);
			}
		} catch (emailErr) {
			console.error('Order confirmation email failed:', emailErr);
		}
	}

	return json({ received: true });
};
