import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyEmail } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const { allowed, retryAfterMs } = rateLimit(`verify-email:${getClientAddress()}`, 10);
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
	const { token } = body;

	if (!token || typeof token !== 'string') {
		return json({ error: 'Token is required' }, { status: 400 });
	}

	const result = verifyEmail(token);
	if (!result.success) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ ok: true });
};
