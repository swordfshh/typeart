const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
	key: string,
	maxAttempts: number = 5,
	windowMs: number = 15 * 60 * 1000
): { allowed: boolean; retryAfterMs: number } {
	const now = Date.now();
	const entry = windows.get(key);

	if (!entry || now > entry.resetAt) {
		windows.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterMs: 0 };
	}

	if (entry.count >= maxAttempts) {
		return { allowed: false, retryAfterMs: entry.resetAt - now };
	}

	entry.count++;
	return { allowed: true, retryAfterMs: 0 };
}

export function cleanupRateLimits(): void {
	const now = Date.now();
	for (const [key, entry] of windows) {
		if (now > entry.resetAt) windows.delete(key);
	}
}
