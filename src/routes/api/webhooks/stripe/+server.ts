import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripe, STRIPE_WEBHOOK_SECRET } from '$lib/server/stripe.js';
import {
	getOrderById,
	isWebhookEventProcessed,
	processPaymentWebhook,
	recordWebhookEvent
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

	// Deduplicate: skip if this event was already processed
	if (isWebhookEventProcessed(event.id)) {
		return json({ received: true });
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const orderId = session.metadata?.order_id;

		if (!orderId) {
			console.warn(`Stripe webhook ${event.id}: checkout.session.completed missing order_id in metadata`);
			recordWebhookEvent(event.id, event.type);
			return json({ received: true });
		}

		// Verify payment was actually completed
		if (session.payment_status !== 'paid') {
			console.warn(`Stripe webhook ${event.id}: payment_status is '${session.payment_status}', not 'paid'`);
			recordWebhookEvent(event.id, event.type, orderId);
			return json({ received: true });
		}

		const order = getOrderById(orderId);
		if (!order) {
			console.error(`Stripe webhook ${event.id}: order ${orderId} not found in database`);
			recordWebhookEvent(event.id, event.type, orderId);
			return json({ received: true });
		}

		if (order.status === 'paid') {
			recordWebhookEvent(event.id, event.type, orderId);
			return json({ received: true });
		}

		// Atomically update payment status and record event (prevents race condition)
		const processed = processPaymentWebhook(
			event.id,
			event.type,
			orderId,
			session.payment_intent as string
		);

		if (!processed) {
			// Another thread already processed this event
			return json({ received: true });
		}

		// Send confirmation email (best-effort, logged on failure)
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
				await sendOrderConfirmationEmail(user.email, orderId, emailItems, order.total_cents);
			} else {
				console.error(`Stripe webhook ${event.id}: no email found for user ${order.user_id} (order ${orderId})`);
			}
		} catch (emailErr) {
			console.error(`Order confirmation email failed for order ${orderId}:`, emailErr);
		}
	} else if (event.type === 'checkout.session.expired') {
		const session = event.data.object;
		const orderId = session.metadata?.order_id;
		if (orderId) {
			console.log(`Stripe checkout session expired for order ${orderId}`);
		}
		recordWebhookEvent(event.id, event.type, orderId ?? undefined);
	} else if (event.type === 'charge.dispute.created') {
		const dispute = event.data.object;
		console.error(`DISPUTE received for charge ${dispute.charge}, amount: ${dispute.amount}, reason: ${dispute.reason}`);
		recordWebhookEvent(event.id, event.type);
	} else if (event.type === 'charge.failed') {
		const charge = event.data.object;
		console.error(`Charge FAILED: ${charge.id}, failure: ${charge.failure_message ?? 'unknown'}`);
		recordWebhookEvent(event.id, event.type);
	} else {
		// Record unhandled events for audit trail
		recordWebhookEvent(event.id, event.type);
	}

	return json({ received: true });
};
