import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { changePassword, createSession, AuthError, COOKIE_OPTIONS, SESSION_COOKIE } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';
import { logSecurity } from '$lib/server/security-log.js';

export const POST: RequestHandler = async ({ request, locals, cookies, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const { allowed, retryAfterMs } = rateLimit(`change-pw:${locals.user.id}`, 5);
	if (!allowed) {
		return json(
			{ error: 'Too many attempts. Try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	const body = await request.json();
	const { currentPassword, newPassword } = body;

	if (!currentPassword || !newPassword) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		await changePassword(locals.user.id, currentPassword, newPassword);
		// changePassword invalidates all sessions, create a fresh one
		const sessionId = createSession(locals.user.id);
		cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
		logSecurity('password_changed', getClientAddress(), locals.user.id);
		return json({ success: true });
	} catch (err) {
		if (err instanceof AuthError) {
			return json({ error: err.message }, { status: 400 });
		}
		throw err;
	}
};
