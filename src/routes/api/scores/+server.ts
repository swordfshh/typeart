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

const VALID_MODES = ['time', 'words', 'quote'];
const VALID_PARAMS: Record<string, string[]> = {
	time: ['15', '30', '60'],
	words: ['10', '25', '50'],
	quote: ['']
};

export const GET: RequestHandler = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'time';
	if (!VALID_MODES.includes(mode)) {
		return json({ error: 'Invalid mode' }, { status: 400 });
	}

	const param = url.searchParams.get('param') || (mode === 'quote' ? '' : '30');
	const validParams = VALID_PARAMS[mode];
	if (validParams && !validParams.includes(param)) {
		return json({ error: 'Invalid parameter' }, { status: 400 });
	}

	const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || 20) || 20), 100);

	const scores = getTopScores(mode, param || null, limit);
	return json({ scores });
};
