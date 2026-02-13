import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitScore, getTopScores, ScoreError } from '$lib/server/scores.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const { allowed, retryAfterMs } = rateLimit(`scores:${locals.user.id}`, 30);
	if (!allowed) {
		return json(
			{ error: 'Too many submissions. Try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	const body = await request.json();

	try {
		const id = submitScore(locals.user.id, {
			mode: body.mode,
			mode_param: body.mode_param ?? null,
			wpm: body.wpm,
			raw_wpm: body.raw_wpm,
			accuracy: body.accuracy,
			char_count: body.char_count,
			elapsed_seconds: body.elapsed_seconds
		});
		return json({ id });
	} catch (err) {
		if (err instanceof ScoreError) {
			return json({ error: err.message }, { status: 400 });
		}
		throw err;
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'time';
	const param = url.searchParams.get('param') || '30';
	const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100);

	const scores = getTopScores(mode, param, limit);
	return json({ scores });
};
