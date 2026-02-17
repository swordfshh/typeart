import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdmin } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';
import {
	getOrderById,
	updateOrderStatus,
	setTracking,
	getOrderEmail
} from '$lib/server/orders.js';
import { sendShippingNotificationEmail } from '$lib/server/email.js';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !isAdmin(locals.user.id)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const order = getOrderById(params.id);
	if (!order) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	return json({ order });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || !isAdmin(locals.user.id)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { allowed, retryAfterMs } = rateLimit(`admin:orders:${locals.user.id}`, 60);
	if (!allowed) {
		return json(
			{ error: 'Too many requests. Try again later.' },
			{ status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
		);
	}

	const body = await request.json();
	const { status, trackingNumber, carrier } = body;

	if (!status || typeof status !== 'string') {
		return json({ error: 'Status is required' }, { status: 400 });
	}

	// If marking as shipped, require tracking info
	if (status === 'shipped') {
		if (!trackingNumber || typeof trackingNumber !== 'string' || !trackingNumber.trim()) {
			return json({ error: 'Tracking number is required when shipping' }, { status: 400 });
		}
		if (!carrier || typeof carrier !== 'string' || !carrier.trim()) {
			return json({ error: 'Carrier is required when shipping' }, { status: 400 });
		}

		setTracking(params.id, trackingNumber.trim(), carrier.trim());
	}

	const result = updateOrderStatus(params.id, status);
	if (!result.success) {
		return json({ error: result.error }, { status: 400 });
	}

	// Send shipping notification email
	if (status === 'shipped') {
		try {
			const email = getOrderEmail(params.id);
			if (email) {
				sendShippingNotificationEmail(email, params.id, trackingNumber.trim(), carrier.trim());
			}
		} catch (err) {
			console.error('Shipping notification email failed:', err);
		}
	}

	const order = getOrderById(params.id);
	return json({ order });
};
