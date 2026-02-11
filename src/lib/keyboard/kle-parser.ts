/**
 * Parses VIA's KLE-style JSON layout into an array of positioned keys.
 *
 * VIA definitions use a subset of KLE (keyboard-layout-editor.com) format:
 * - Matrix position is encoded as "row,col" in the top-left legend
 * - Layout options are encoded as "group,choice" in the bottom-right legend (legend index 8)
 * - Property objects set x/y offsets, sizes, and rotation
 */

import type { ParsedKey, KLERow, KLEKeyProperties } from './types.js';

export function parseKLELayout(rows: KLERow[]): ParsedKey[] {
	const keys: ParsedKey[] = [];

	// Current position tracking
	let curX = 0;
	let curY = 0;
	let curR = 0;
	let curRx = 0;
	let curRy = 0;

	// Per-key properties (reset after each key)
	let nextW = 1;
	let nextH = 1;
	let nextW2 = 0;
	let nextH2 = 0;
	let nextX2 = 0;
	let nextY2 = 0;

	for (const row of rows) {
		// Each row resets X to the rotation origin X
		curX = curRx;
		curY += 1;

		for (const item of row) {
			if (typeof item === 'object' && item !== null) {
				// Property object — update state
				const props = item as KLEKeyProperties;

				if (props.r !== undefined) curR = props.r;
				if (props.rx !== undefined) {
					curRx = props.rx;
					curX = curRx;
				}
				if (props.ry !== undefined) {
					curRy = props.ry;
					curY = curRy;
				}

				if (props.x !== undefined) curX += props.x;
				if (props.y !== undefined) {
					curY += props.y;
				}

				if (props.w !== undefined) nextW = props.w;
				if (props.h !== undefined) nextH = props.h;
				if (props.w2 !== undefined) nextW2 = props.w2;
				if (props.h2 !== undefined) nextH2 = props.h2;
				if (props.x2 !== undefined) nextX2 = props.x2;
				if (props.y2 !== undefined) nextY2 = props.y2;

				// Decal keys are skipped
				if (props.d) {
					// Still consume position
					continue;
				}
			} else {
				// String item — this is a key
				const legends = (item as string).split('\n');

				// Parse matrix position from top-left legend (index 0)
				let matrixRow = 0;
				let matrixCol = 0;
				if (legends[0]) {
					const parts = legends[0].split(',');
					if (parts.length === 2) {
						matrixRow = parseInt(parts[0], 10);
						matrixCol = parseInt(parts[1], 10);
					}
				}

				// Parse layout option from bottom-right legend (index 8 in KLE: legends split by \n)
				// VIA uses index 8 for layout option group,choice
				let optionGroup = -1;
				let optionChoice = -1;
				// In the KLE string, legends are ordered:
				// 0:top-left, 1:bottom-left, 2:top-right, 3:bottom-right,
				// 4:front-left, 5:front-right, 6:center-left, 7:center-right,
				// 8:top-center, 9:center, 10:bottom-center, 11:front-center
				if (legends.length > 3 && legends[3]) {
					const parts = legends[3].split(',');
					if (parts.length === 2) {
						optionGroup = parseInt(parts[0], 10);
						optionChoice = parseInt(parts[1], 10);
					}
				}

				const key: ParsedKey = {
					row: matrixRow,
					col: matrixCol,
					x: curX,
					y: curY,
					w: nextW,
					h: nextH,
					w2: nextW2,
					h2: nextH2,
					x2: nextX2,
					y2: nextY2,
					r: curR,
					rx: curRx,
					ry: curRy,
					optionGroup,
					optionChoice
				};

				keys.push(key);

				// Advance X position
				curX += nextW;

				// Reset per-key properties
				nextW = 1;
				nextH = 1;
				nextW2 = 0;
				nextH2 = 0;
				nextX2 = 0;
				nextY2 = 0;
			}
		}
	}

	return keys;
}

/**
 * Filters keys based on current layout option selections.
 * layoutOptions is an array where index = option group, value = selected choice.
 */
export function filterKeysByLayoutOptions(
	keys: ParsedKey[],
	layoutOptions: number[]
): ParsedKey[] {
	return keys.filter((key) => {
		// Keys with no option group are always shown
		if (key.optionGroup === -1) return true;

		// Show this key only if its choice matches the selected option
		const group = key.optionGroup;
		const selectedChoice = layoutOptions[group] ?? 0;
		return key.optionChoice === selectedChoice;
	});
}
