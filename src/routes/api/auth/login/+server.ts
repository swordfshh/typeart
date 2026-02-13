import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { login, AuthError, COOKIE_OPTIONS, SESSION_COOKIE } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const { allowed, retryAfterMs } = rateLimit(`login:${getClientAddress()}`, 10);
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
	const { email, password } = body;

	if (!email || !password) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		const { user, sessionId } = await login(email, password);
		cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
		return json({ user });
	} catch (err) {
		if (err instanceof AuthError) {
			return json({ error: err.message }, { status: 401 });
		}
		throw err;
	}
};
