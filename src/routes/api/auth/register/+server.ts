import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { register, AuthError, COOKIE_OPTIONS, SESSION_COOKIE } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const { allowed, retryAfterMs } = rateLimit(`register:${getClientAddress()}`, 5);
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
	const { username, email, password } = body;

	if (!username || !email || !password) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		const { user, sessionId } = await register(username, email, password);
		cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
		return json({ user });
	} catch (err) {
		if (err instanceof AuthError) {
			return json({ error: err.message }, { status: 400 });
		}
		throw err;
	}
};
