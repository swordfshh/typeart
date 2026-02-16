/**
 * Maps any 16-bit keycode to a human-readable display string.
 * Handles parameterized keycodes like LT(layer,kc), MO(layer), MT(mod,kc).
 */

import { getKeycodeEntry } from './catalog.js';
import * as R from './ranges.js';

/** Modifier bit names */
const MOD_NAMES: Record<number, string> = {
	0x01: 'Ctrl',
	0x02: 'Shift',
	0x04: 'Alt',
	0x08: 'GUI',
	0x11: 'RCtrl',
	0x12: 'RShift',
	0x14: 'RAlt',
	0x18: 'RGUI'
};

function modBitsToString(mods: number): string {
	const parts: string[] = [];
	// Right-side modifiers use bit 4
	const isRight = (mods & 0x10) !== 0;
	const prefix = isRight ? 'R' : '';
	if (mods & 0x01) parts.push(prefix + 'Ctrl');
	if (mods & 0x02) parts.push(prefix + 'Shift');
	if (mods & 0x04) parts.push(prefix + 'Alt');
	if (mods & 0x08) parts.push(prefix + 'GUI');
	return parts.join('+');
}

function basicKeycodeLabel(code: number): string {
	const entry = getKeycodeEntry(code & 0xff);
	return entry?.shortLabel ?? `0x${(code & 0xff).toString(16).padStart(2, '0')}`;
}

/**
 * Get the display label for any 16-bit QMK keycode.
 */
export function getKeycodeLabel(keycode: number): string {
	// Check direct lookup first
	const entry = getKeycodeEntry(keycode);
	if (entry) return entry.shortLabel;

	// Layer-Tap: LT(layer, kc) = 0x4000 | (layer << 8) | kc
	if (keycode >= R.QK_LAYER_TAP_MIN && keycode <= R.QK_LAYER_TAP_MAX) {
		const layer = (keycode >> 8) & 0x0f;
		const kc = keycode & 0xff;
		if (kc === 0) return `MO(${layer})`;
		return `LT${layer}(${basicKeycodeLabel(kc)})`;
	}

	// Mod-Tap: MT(mod, kc) = 0x2000 | (mod << 8) | kc
	if (keycode >= R.QK_MOD_TAP_MIN && keycode <= R.QK_MOD_TAP_MAX) {
		const mod = (keycode >> 8) & 0x1f;
		const kc = keycode & 0xff;
		const modStr = modBitsToString(mod);
		return `${modStr}(${basicKeycodeLabel(kc)})`;
	}

	// Mods: basic keycode with modifier bits
	if (keycode >= R.QK_MODS_MIN && keycode <= R.QK_MODS_MAX) {
		const mods = (keycode >> 8) & 0x1f;
		const kc = keycode & 0xff;
		const modStr = modBitsToString(mods);
		return `${modStr}+${basicKeycodeLabel(kc)}`;
	}

	// Momentary layer: MO(layer) = 0x5220 | layer
	if (keycode >= R.QK_MOMENTARY_MIN && keycode <= R.QK_MOMENTARY_MAX) {
		return `MO(${keycode & 0x1f})`;
	}

	// Toggle layer: TG(layer) = 0x5260 | layer
	if (keycode >= R.QK_TOGGLE_LAYER_MIN && keycode <= R.QK_TOGGLE_LAYER_MAX) {
		return `TG(${keycode & 0x1f})`;
	}

	// To layer: TO(layer) = 0x5200 | layer
	if (keycode >= R.QK_TO_MIN && keycode <= R.QK_TO_MAX) {
		return `TO(${keycode & 0x1f})`;
	}

	// Default layer: DF(layer) = 0x5240 | layer
	if (keycode >= R.QK_DEF_LAYER_MIN && keycode <= R.QK_DEF_LAYER_MAX) {
		return `DF(${keycode & 0x1f})`;
	}

	// One-shot layer: OSL(layer) = 0x5280 | layer
	if (keycode >= R.QK_ONE_SHOT_LAYER_MIN && keycode <= R.QK_ONE_SHOT_LAYER_MAX) {
		return `OSL(${keycode & 0x1f})`;
	}

	// One-shot mod: OSM(mod) = 0x52a0 | mod
	if (keycode >= R.QK_ONE_SHOT_MOD_MIN && keycode <= R.QK_ONE_SHOT_MOD_MAX) {
		const mod = keycode & 0x1f;
		return `OSM(${modBitsToString(mod)})`;
	}

	// Layer tap toggle: TT(layer) = 0x52c0 | layer
	if (keycode >= R.QK_LAYER_TAP_TOGGLE_MIN && keycode <= R.QK_LAYER_TAP_TOGGLE_MAX) {
		return `TT(${keycode & 0x1f})`;
	}

	// Layer Mod: LM(layer, mod) = 0x5000 | (layer << 5) | mod
	if (keycode >= R.QK_LAYER_MOD_MIN && keycode <= R.QK_LAYER_MOD_MAX) {
		const param = keycode & 0x01ff;
		const layer = (param >> 4) & 0x0f;
		const mod = param & 0x0f;
		return `LM${layer}(${modBitsToString(mod)})`;
	}

	// Tap dance
	if (keycode >= R.QK_TAP_DANCE_MIN && keycode <= R.QK_TAP_DANCE_MAX) {
		return `TD(${keycode & 0xff})`;
	}

	// Macro
	if (keycode >= R.QK_MACRO_MIN && keycode <= R.QK_MACRO_MAX) {
		return `M(${keycode & 0xff})`;
	}

	// Fallback: hex display
	return `0x${keycode.toString(16).padStart(4, '0')}`;
}
