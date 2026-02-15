import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requestPasswordReset } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const { allowed, retryAfterMs } = rateLimit(`forgot:${getClientAddress()}`, 3);
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
	const { email } = body;

	if (!email) {
		return json({ error: 'Email is required' }, { status: 400 });
	}

	await requestPasswordReset(email);

	// Always return success to prevent email enumeration
	return json({ ok: true });
};
