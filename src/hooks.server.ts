import type { Handle } from '@sveltejs/kit';
import { getSession, cleanExpiredSessions, cleanExpiredResetTokens, SESSION_COOKIE } from '$lib/server/auth.js';
import { cleanupRateLimits } from '$lib/server/rate-limit.js';
import { cleanStalePendingOrders, cleanStaleWebhookEvents } from '$lib/server/orders.js';

setInterval(() => {
	cleanExpiredSessions();
	cleanExpiredResetTokens();
	cleanupRateLimits();
	cleanStalePendingOrders();
	cleanStaleWebhookEvents();
}, 60 * 60 * 1000);

export const handle: Handle = async ({ event, resolve }) => {
	// CSRF protection: reject state-changing requests with mismatched Origin
	// Skip for Stripe webhooks (authenticated via signature verification)
	const isStripeWebhook = event.url.pathname === '/api/webhooks/stripe';
	if (event.request.method !== 'GET' && event.request.method !== 'HEAD' && !isStripeWebhook) {
		const origin = event.request.headers.get('origin');
		if (origin) {
			const url = new URL(event.request.url);
			if (origin !== url.origin) {
				return new Response('Forbidden', { status: 403 });
			}
		}
	}

	const sessionId = event.cookies.get(SESSION_COOKIE);

	if (sessionId) {
		const user = getSession(sessionId);
		if (user) {
			event.locals.user = user;
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const response = await resolve(event);

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains'
	);
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data:",
			"connect-src 'self' https://*.stripe.com",
			"frame-ancestors 'none'"
		].join('; ')
	);

	return response;
};
