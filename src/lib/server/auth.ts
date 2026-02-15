import { db } from './db.js';
import { hash, verify } from '@node-rs/argon2';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { sendPasswordResetEmail } from './email.js';

export interface User {
	id: string;
	username: string;
	email: string;
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
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60
};

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
			if (err.message.includes('username')) {
				throw new AuthError('Username is already taken');
			}
			throw new AuthError('Email is already registered');
		}
		throw err;
	}

	const sessionId = createSession(id);
	return {
		user: { id, username, email, created_at: new Date().toISOString() },
		sessionId
	};
}

export async function login(
	email: string,
	password: string
): Promise<{ user: User; sessionId: string }> {
	email = email.trim().toLowerCase();

	const row = db
		.prepare('SELECT * FROM users WHERE email = ?')
		.get(email) as UserRow | undefined;

	if (!row) {
		throw new AuthError('Invalid email or password');
	}

	const valid = await verify(row.password_hash, password);
	if (!valid) {
		throw new AuthError('Invalid email or password');
	}

	const sessionId = createSession(row.id);
	return {
		user: { id: row.id, username: row.username, email: row.email, created_at: row.created_at },
		sessionId
	};
}

export function getSession(sessionId: string): User | null {
	const row = db
		.prepare(
			`SELECT u.id, u.username, u.email, u.created_at
			 FROM sessions s JOIN users u ON s.user_id = u.id
			 WHERE s.id = ? AND s.expires_at > datetime('now')`
		)
		.get(sessionId) as User | undefined;

	return row ?? null;
}

export function logout(sessionId: string): void {
	db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function cleanExpiredSessions(): void {
	db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

function createSession(userId: string): string {
	const sessionId = randomUUID();
	const expiresAt = new Date(
		Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
	).toISOString();
	db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
		sessionId,
		userId,
		expiresAt
	);
	return sessionId;
}

// --- Password reset ---

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

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
