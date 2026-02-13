import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPersonalBests, getRecentScores } from '$lib/server/scores.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const type = url.searchParams.get('type') || 'bests';

	if (type === 'recent') {
		const scores = getRecentScores(locals.user.id);
		return json({ scores });
	}

	const scores = getPersonalBests(locals.user.id);
	return json({ scores });
};
