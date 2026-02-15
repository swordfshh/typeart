import type { Handle } from '@sveltejs/kit';
import { getSession, cleanExpiredSessions, cleanExpiredResetTokens, SESSION_COOKIE } from '$lib/server/auth.js';
import { cleanupRateLimits } from '$lib/server/rate-limit.js';

setInterval(() => {
	cleanExpiredSessions();
	cleanExpiredResetTokens();
	cleanupRateLimits();
}, 60 * 60 * 1000);

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE);

	if (sessionId) {
		const user = getSession(sessionId);
		if (user) {
			event.locals.user = user;
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	return resolve(event);
};
