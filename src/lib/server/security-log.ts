import { db } from './db.js';

export type SecurityEvent =
	| 'login_failed'
	| 'login_success'
	| 'account_locked'
	| 'register'
	| 'password_changed'
	| 'password_reset'
	| 'account_deleted'
	| 'rate_limited';

export function logSecurity(event: SecurityEvent, ip: string | null, userId: string | null, detail?: string): void {
	db.prepare(
		'INSERT INTO security_logs (event, ip, user_id, detail) VALUES (?, ?, ?, ?)'
	).run(event, ip, userId, detail ?? null);
}
