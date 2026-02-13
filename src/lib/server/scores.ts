import { db } from './db.js';
import { randomUUID } from 'node:crypto';

export interface ScoreInput {
	mode: string;
	mode_param: string | null;
	wpm: number;
	raw_wpm: number;
	accuracy: number;
	char_count: number;
	elapsed_seconds: number;
}

export interface ScoreRow {
	id: string;
	username: string;
	wpm: number;
	raw_wpm: number;
	accuracy: number;
	char_count: number;
	elapsed_seconds: number;
	created_at: string;
}

const VALID_MODES = ['time', 'words', 'quote'];
const VALID_TIME_PARAMS = ['15', '30', '60'];
const VALID_WORDS_PARAMS = ['10', '25', '50'];

export class ScoreError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ScoreError';
	}
}

export function validateScore(input: ScoreInput): void {
	if (!VALID_MODES.includes(input.mode)) {
		throw new ScoreError('Invalid mode');
	}
	if (input.mode === 'time' && !VALID_TIME_PARAMS.includes(String(input.mode_param))) {
		throw new ScoreError('Invalid time parameter');
	}
	if (input.mode === 'words' && !VALID_WORDS_PARAMS.includes(String(input.mode_param))) {
		throw new ScoreError('Invalid words parameter');
	}
	if (input.wpm < 0 || input.wpm > 300) {
		throw new ScoreError('WPM out of range');
	}
	if (input.accuracy < 0 || input.accuracy > 100) {
		throw new ScoreError('Accuracy out of range');
	}
	if (input.char_count < 5) {
		throw new ScoreError('Too few characters typed');
	}
	if (input.elapsed_seconds < 1) {
		throw new ScoreError('Elapsed time too short');
	}
}

export function submitScore(userId: string, input: ScoreInput): string {
	validateScore(input);
	const id = randomUUID();
	db.prepare(
		`INSERT INTO typing_scores (id, user_id, mode, mode_param, wpm, raw_wpm, accuracy, char_count, elapsed_seconds)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		id,
		userId,
		input.mode,
		input.mode_param,
		input.wpm,
		input.raw_wpm,
		input.accuracy,
		input.char_count,
		input.elapsed_seconds
	);
	return id;
}

export function getTopScores(mode: string, modeParam: string | null, limit: number = 20): ScoreRow[] {
	return db
		.prepare(
			`SELECT s.id, u.username, s.wpm, s.raw_wpm, s.accuracy, s.char_count, s.elapsed_seconds, s.created_at
			 FROM typing_scores s JOIN users u ON s.user_id = u.id
			 WHERE s.mode = ? AND (s.mode_param = ? OR (s.mode_param IS NULL AND ? IS NULL))
			 ORDER BY s.wpm DESC, s.accuracy DESC
			 LIMIT ?`
		)
		.all(mode, modeParam, modeParam, limit) as ScoreRow[];
}

export function getPersonalBests(userId: string): ScoreRow[] {
	return db
		.prepare(
			`SELECT s.id, u.username, s.wpm, s.raw_wpm, s.accuracy, s.char_count, s.elapsed_seconds, s.created_at,
			        s.mode, s.mode_param
			 FROM typing_scores s JOIN users u ON s.user_id = u.id
			 WHERE s.user_id = ?
			 AND s.wpm = (
				SELECT MAX(s2.wpm) FROM typing_scores s2
				WHERE s2.user_id = s.user_id AND s2.mode = s.mode
				AND (s2.mode_param = s.mode_param OR (s2.mode_param IS NULL AND s.mode_param IS NULL))
			 )
			 ORDER BY s.mode, s.mode_param`
		)
		.all(userId) as ScoreRow[];
}

export function getRecentScores(userId: string, limit: number = 10): ScoreRow[] {
	return db
		.prepare(
			`SELECT s.id, u.username, s.wpm, s.raw_wpm, s.accuracy, s.char_count, s.elapsed_seconds, s.created_at,
			        s.mode, s.mode_param
			 FROM typing_scores s JOIN users u ON s.user_id = u.id
			 WHERE s.user_id = ?
			 ORDER BY s.created_at DESC
			 LIMIT ?`
		)
		.all(userId, limit) as ScoreRow[];
}
