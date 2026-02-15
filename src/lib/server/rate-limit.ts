import { db } from './db.js';

export function rateLimit(
	key: string,
	maxAttempts: number = 5,
	windowMs: number = 15 * 60 * 1000
): { allowed: boolean; retryAfterMs: number } {
	const now = Date.now();

	const row = db
		.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?')
		.get(key) as { count: number; reset_at: number } | undefined;

	// No entry or window expired — start fresh
	if (!row || now > row.reset_at) {
		db.prepare(
			'INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)'
		).run(key, now + windowMs);
		return { allowed: true, retryAfterMs: 0 };
	}

	// Over limit
	if (row.count >= maxAttempts) {
		return { allowed: false, retryAfterMs: row.reset_at - now };
	}

	// Increment
	db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key);
	return { allowed: true, retryAfterMs: 0 };
}

export function cleanupRateLimits(): void {
	db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(Date.now());
}
