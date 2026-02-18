import { db } from './db.js';
import { hash, verify } from '@node-rs/argon2';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { sendPasswordResetEmail, sendVerificationEmail } from './email.js';

export interface User {
	id: string;
	username: string;
	email: string;
	email_verified: boolean;
	created_at: string;
}

interface UserRow extends User {
	password_hash: string;
}

const SESSION_MAX_AGE_DAYS = 30;

export const SESSION_COOKIE = 'session';

export const COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	secure: true,
	sameSite: 'lax' as const,
	maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60
};

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '';

export function isAdmin(userId: string): boolean {
	return ADMIN_USER_ID !== '' && userId === ADMIN_USER_ID;
}

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

export async function register(
	username: string,
	email: string,
	password: string
): Promise<{ user: User; sessionId: string }> {
	username = username.trim();
	email = email.trim().toLowerCase();

	if (username.length < 2 || username.length > 30) {
		throw new AuthError('Username must be 2-30 characters');
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		throw new AuthError('Username may only contain letters, numbers, hyphens, and underscores');
	}
	if (!email.includes('@') || email.length < 5) {
		throw new AuthError('Invalid email address');
	}
	if (password.length < 8) {
		throw new AuthError('Password must be at least 8 characters');
	}

	const id = randomUUID();
	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		parallelism: 1
	});

	try {
		db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)').run(
			id,
			username,
			email,
			passwordHash
		);
	} catch (err: unknown) {
		if (err instanceof Error && 'code' in err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			throw new AuthError('Username or email is already in use');
		}
		throw err;
	}

	// Send verification email (fire-and-forget)
	const verificationToken = randomBytes(32).toString('hex');
	const tokenHash = hashToken(verificationToken);
	const tokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS).toISOString();
	db.prepare(
		'INSERT INTO email_verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
	).run(tokenHash, id, tokenExpiresAt);
	sendVerificationEmail(email, verificationToken).catch((err) =>
		console.error('Verification email failed:', err)
	);

	const sessionId = createSession(id);
	return {
		user: { id, username, email, email_verified: false, created_at: new Date().toISOString() },
		sessionId
	};
}

// Pre-computed dummy hash for constant-time login (prevents timing-based email enumeration)
// Generated at startup so verify() takes the same time whether user exists or not
const DUMMY_HASH_PROMISE = hash('dummy-password-for-timing', {
	memoryCost: 19456,
	timeCost: 2,
	parallelism: 1
});

export async function login(
	email: string,
	password: string
): Promise<{ user: User; sessionId: string }> {
	email = email.trim().toLowerCase();

	// Check account lockout
	const attempt = db
		.prepare('SELECT failed_count, locked_until FROM login_attempts WHERE email = ?')
		.get(email) as { failed_count: number; locked_until: string | null } | undefined;

	if (attempt?.locked_until) {
		const lockedUntil = new Date(attempt.locked_until + 'Z').getTime();
		if (Date.now() < lockedUntil) {
			throw new AuthError('Account temporarily locked. Try again later.');
		}
		// Lock expired, reset
		db.prepare('DELETE FROM login_attempts WHERE email = ?').run(email);
	}

	const row = db
		.prepare('SELECT id, username, email, email_verified, password_hash, created_at FROM users WHERE email = ?')
		.get(email) as (UserRow & { email_verified: number }) | undefined;

	// Always run verify to prevent timing-based email enumeration
	const dummyHash = await DUMMY_HASH_PROMISE;
	const hashToVerify = row ? row.password_hash : dummyHash;
	const valid = await verify(hashToVerify, password);

	if (!row || !valid) {
		// Track failed attempt
		if (row) {
			const count = (attempt?.failed_count ?? 0) + 1;
			let lockedUntil: string | null = null;
			if (count >= 10) {
				lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
			} else if (count >= 5) {
				lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
			}
			db.prepare(
				`INSERT INTO login_attempts (email, failed_count, locked_until, last_attempt_at)
				 VALUES (?, ?, ?, datetime('now'))
				 ON CONFLICT(email) DO UPDATE SET failed_count = ?, locked_until = ?, last_attempt_at = datetime('now')`
			).run(email, count, lockedUntil, count, lockedUntil);
		}
		throw new AuthError('Invalid email or password');
	}

	// Successful login — clear failed attempts
	db.prepare('DELETE FROM login_attempts WHERE email = ?').run(email);

	const sessionId = createSession(row.id);
	return {
		user: { id: row.id, username: row.username, email: row.email, email_verified: row.email_verified === 1, created_at: row.created_at },
		sessionId
	};
}

export function getSession(sessionId: string): User | null {
	const row = db
		.prepare(
			`SELECT u.id, u.username, u.email, u.email_verified, u.created_at
			 FROM sessions s JOIN users u ON s.user_id = u.id
			 WHERE s.id = ? AND s.expires_at > datetime('now')`
		)
		.get(sessionId) as (Omit<User, 'email_verified'> & { email_verified: number }) | undefined;

	if (!row) return null;
	return { ...row, email_verified: row.email_verified === 1 };
}

export function logout(sessionId: string): void {
	db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function cleanExpiredSessions(): void {
	db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

const MAX_SESSIONS_PER_USER = 5;

export function createSession(userId: string): string {
	const sessionId = randomBytes(32).toString('hex');
	const expiresAt = new Date(
		Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
	).toISOString();

	// Enforce max sessions: delete oldest if over limit
	const count = (db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(userId) as { c: number }).c;
	if (count >= MAX_SESSIONS_PER_USER) {
		db.prepare(
			`DELETE FROM sessions WHERE id IN (
				SELECT id FROM sessions WHERE user_id = ?
				ORDER BY created_at ASC LIMIT ?
			)`
		).run(userId, count - MAX_SESSIONS_PER_USER + 1);
	}

	db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
		sessionId,
		userId,
		expiresAt
	);
	return sessionId;
}

// --- Password change ---

export async function changePassword(
	userId: string,
	currentPassword: string,
	newPassword: string
): Promise<void> {
	if (newPassword.length < 8) {
		throw new AuthError('Password must be at least 8 characters');
	}

	const row = db
		.prepare('SELECT password_hash FROM users WHERE id = ?')
		.get(userId) as { password_hash: string } | undefined;

	if (!row) {
		throw new AuthError('User not found');
	}

	const valid = await verify(row.password_hash, currentPassword);
	if (!valid) {
		throw new AuthError('Current password is incorrect');
	}

	const passwordHash = await hash(newPassword, {
		memoryCost: 19456,
		timeCost: 2,
		parallelism: 1
	});

	db.transaction(() => {
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
		// Invalidate all other sessions (keep current one via the caller)
		db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
	})();
}

// --- Account deletion ---

export function deleteAccount(userId: string): void {
	db.transaction(() => {
		db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM typing_scores WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)').run(userId);
		db.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM users WHERE id = ?').run(userId);
	})();
}

// --- Token hashing ---

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

// --- Email verification ---

const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isEmailVerified(userId: string): boolean {
	const row = db
		.prepare('SELECT email_verified FROM users WHERE id = ?')
		.get(userId) as { email_verified: number } | undefined;
	return row?.email_verified === 1;
}

export function verifyEmail(token: string): { success: boolean; error?: string } {
	const tokenHash = hashToken(token);

	const row = db
		.prepare(
			`SELECT user_id FROM email_verification_tokens
			 WHERE token_hash = ? AND expires_at > datetime('now')`
		)
		.get(tokenHash) as { user_id: string } | undefined;

	if (!row) {
		return { success: false, error: 'Invalid or expired verification link' };
	}

	db.transaction(() => {
		db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id);
		db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(row.user_id);
	})();

	return { success: true };
}

export async function resendVerification(userId: string): Promise<{ success: boolean; error?: string }> {
	const user = db
		.prepare('SELECT email, email_verified FROM users WHERE id = ?')
		.get(userId) as { email: string; email_verified: number } | undefined;

	if (!user) return { success: false, error: 'User not found' };
	if (user.email_verified === 1) return { success: false, error: 'Email already verified' };

	// Delete existing tokens, generate new one
	db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(userId);

	const token = randomBytes(32).toString('hex');
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS).toISOString();

	db.prepare(
		'INSERT INTO email_verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
	).run(tokenHash, userId, expiresAt);

	await sendVerificationEmail(user.email, token);
	return { success: true };
}

// --- Password reset ---

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(email: string): Promise<void> {
	email = email.trim().toLowerCase();

	const user = db
		.prepare('SELECT id, email FROM users WHERE email = ?')
		.get(email) as { id: string; email: string } | undefined;

	// Always return silently to prevent email enumeration
	if (!user) return;

	// One active token per user
	db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

	const token = randomBytes(32).toString('hex');
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString();

	db.prepare(
		'INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
	).run(tokenHash, user.id, expiresAt);

	await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
	if (newPassword.length < 8) {
		throw new AuthError('Password must be at least 8 characters');
	}

	const tokenHash = hashToken(token);

	const row = db
		.prepare(
			`SELECT user_id FROM password_reset_tokens
			 WHERE token_hash = ? AND expires_at > datetime('now')`
		)
		.get(tokenHash) as { user_id: string } | undefined;

	if (!row) {
		throw new AuthError('Invalid or expired reset link');
	}

	const passwordHash = await hash(newPassword, {
		memoryCost: 19456,
		timeCost: 2,
		parallelism: 1
	});

	db.transaction(() => {
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.user_id);
		db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?').run(tokenHash);
		db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.user_id);
	})();
}

export function cleanExpiredResetTokens(): void {
	db.prepare("DELETE FROM password_reset_tokens WHERE expires_at < datetime('now')").run();
}
