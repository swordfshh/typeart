import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resetPassword, AuthError } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const { allowed, retryAfterMs } = rateLimit(`reset:${getClientAddress()}`, 5);
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
	const { token, password } = body;

	if (!token || !password) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		await resetPassword(token, password);
		return json({ ok: true });
	} catch (err) {
		if (err instanceof AuthError) {
			return json({ error: err.message }, { status: 400 });
		}
		throw err;
	}
};
