import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resendVerification } from '$lib/server/auth.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const { allowed, retryAfterMs } = rateLimit(`resend-verify:${locals.user.id}`, 3);
	if (!allowed) {
		return json(
			{ error: 'Too many attempts. Try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	const result = await resendVerification(locals.user.id);
	if (!result.success) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ ok: true });
};
