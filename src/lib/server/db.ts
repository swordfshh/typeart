import Database from 'better-sqlite3';
import { building } from '$app/environment';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'data', 'typeart.db');

function createDb(): Database.Database {
	if (building) {
		return null as unknown as Database.Database;
	}

	mkdirSync(dirname(DB_PATH), { recursive: true });

	const db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');

	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS typing_scores (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			mode TEXT NOT NULL,
			mode_param TEXT,
			wpm INTEGER NOT NULL,
			raw_wpm INTEGER NOT NULL,
			accuracy INTEGER NOT NULL,
			char_count INTEGER NOT NULL,
			elapsed_seconds REAL NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
		CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
		CREATE INDEX IF NOT EXISTS idx_scores_user ON typing_scores(user_id);
		CREATE INDEX IF NOT EXISTS idx_scores_mode_wpm ON typing_scores(mode, wpm DESC);

		CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			status TEXT NOT NULL DEFAULT 'pending',
			total_cents INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS order_items (
			id TEXT PRIMARY KEY,
			order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
			product_slug TEXT NOT NULL,
			product_name TEXT NOT NULL,
			base_price_cents INTEGER NOT NULL,
			color TEXT NOT NULL,
			stabilizer_name TEXT NOT NULL,
			stabilizer_price_cents INTEGER NOT NULL,
			wrist_rest INTEGER NOT NULL DEFAULT 0,
			wrist_rest_price_cents INTEGER NOT NULL DEFAULT 0,
			quantity INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS password_reset_tokens (
			token_hash TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
		CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
		CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
		CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);
	`);

	return db;
}

export const db = createDb();
