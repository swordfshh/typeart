import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logout, SESSION_COOKIE } from '$lib/server/auth.js';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		logout(sessionId);
		cookies.delete(SESSION_COOKIE, { path: '/' });
	}
	return json({ ok: true });
};
