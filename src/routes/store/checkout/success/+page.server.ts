import type { PageServerLoad } from './$types';
import { getOrderByStripeSession, getOrder } from '$lib/server/orders.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId || !locals.user) {
		return { orderId: null, shipping: null };
	}

	const stub = getOrderByStripeSession(sessionId);
	if (!stub || stub.user_id !== locals.user.id) {
		return { orderId: null, shipping: null };
	}

	const order = getOrder(locals.user.id, stub.id);

	return { orderId: stub.id, shipping: order?.shipping ?? null };
};
