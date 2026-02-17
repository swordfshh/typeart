import type { PageServerLoad } from './$types';
import { getOrderByStripeSession } from '$lib/server/orders.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId || !locals.user) {
		return { orderId: null };
	}

	const order = getOrderByStripeSession(sessionId);
	if (!order || order.user_id !== locals.user.id) {
		return { orderId: null };
	}

	return { orderId: order.id };
};
