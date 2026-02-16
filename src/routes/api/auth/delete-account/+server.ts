import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteAccount, SESSION_COOKIE } from '$lib/server/auth.js';
import { verify } from '@node-rs/argon2';
import { db } from '$lib/server/db.js';
import { rateLimit } from '$lib/server/rate-limit.js';
import { logSecurity } from '$lib/server/security-log.js';

export const POST: RequestHandler = async ({ request, locals, cookies, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const { allowed, retryAfterMs } = rateLimit(`delete-acct:${locals.user.id}`, 3);
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
	const { password } = body;

	if (!password) {
		return json({ error: 'Password is required' }, { status: 400 });
	}

	const row = db
		.prepare('SELECT password_hash FROM users WHERE id = ?')
		.get(locals.user.id) as { password_hash: string } | undefined;

	if (!row) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const valid = await verify(row.password_hash, password);
	if (!valid) {
		return json({ error: 'Incorrect password' }, { status: 400 });
	}

	logSecurity('account_deleted', getClientAddress(), locals.user.id, locals.user.username);
	deleteAccount(locals.user.id);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return json({ success: true });
};
