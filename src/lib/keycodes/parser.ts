/**
 * Parse QMK keycode strings into their 16-bit numeric values.
 * Used by the "Any" key input feature.
 */

import { KEYCODE_CATEGORIES } from './catalog.js';

// Build reverse lookup: name → code
const nameToCode = new Map<string, number>();
for (const cat of KEYCODE_CATEGORIES) {
	for (const entry of cat.keycodes) {
		nameToCode.set(entry.name.toUpperCase(), entry.code);
	}
}

// Common QMK short aliases
const ALIASES: Record<string, string> = {
	KC_TRNS: 'KC_TRANSPARENT',
	KC_ENT: 'KC_ENTER',
	KC_ESC: 'KC_ESCAPE',
	KC_BSPC: 'KC_BACKSPACE',
	KC_SPC: 'KC_SPACE',
	KC_MINS: 'KC_MINUS',
	KC_EQL: 'KC_EQUAL',
	KC_LBRC: 'KC_LEFT_BRACKET',
	KC_RBRC: 'KC_RIGHT_BRACKET',
	KC_BSLS: 'KC_BACKSLASH',
	KC_SCLN: 'KC_SEMICOLON',
	KC_QUOT: 'KC_QUOTE',
	KC_GRV: 'KC_GRAVE',
	KC_COMM: 'KC_COMMA',
	KC_SLSH: 'KC_SLASH',
	KC_CAPS: 'KC_CAPS_LOCK',
	KC_LCTL: 'KC_LEFT_CTRL',
	KC_LSFT: 'KC_LEFT_SHIFT',
	KC_LALT: 'KC_LEFT_ALT',
	KC_LGUI: 'KC_LEFT_GUI',
	KC_RCTL: 'KC_RIGHT_CTRL',
	KC_RSFT: 'KC_RIGHT_SHIFT',
	KC_RALT: 'KC_RIGHT_ALT',
	KC_RGUI: 'KC_RIGHT_GUI',
	KC_DEL: 'KC_DELETE',
	KC_INS: 'KC_INSERT',
	KC_PGUP: 'KC_PAGE_UP',
	KC_PGDN: 'KC_PAGE_DOWN',
	KC_PSCR: 'KC_PRINT_SCREEN',
	KC_RGHT: 'KC_RIGHT',
	KC_UP: 'KC_UP',
	KC_DOWN: 'KC_DOWN',
	KC_LEFT: 'KC_LEFT',
	KC_MUTE: 'KC_AUDIO_MUTE',
	KC_VOLU: 'KC_AUDIO_VOL_UP',
	KC_VOLD: 'KC_AUDIO_VOL_DOWN',
	KC_MNXT: 'KC_MEDIA_NEXT_TRACK',
	KC_MPRV: 'KC_MEDIA_PREV_TRACK',
	KC_MSTP: 'KC_MEDIA_STOP',
	KC_MPLY: 'KC_MEDIA_PLAY_PAUSE',
	KC_MSEL: 'KC_MEDIA_SELECT',
	KC_CALC: 'KC_CALCULATOR',
	KC_MYCM: 'KC_MY_COMPUTER',
	KC_WSCH: 'KC_WWW_SEARCH',
	KC_WHOM: 'KC_WWW_HOME',
	KC_WBAK: 'KC_WWW_BACK',
	KC_WFWD: 'KC_WWW_FORWARD',
	KC_WSTP: 'KC_WWW_STOP',
	KC_WREF: 'KC_WWW_REFRESH',
	KC_WFAV: 'KC_WWW_FAVORITES',
	KC_BRIU: 'KC_BRIGHTNESS_UP',
	KC_BRID: 'KC_BRIGHTNESS_DOWN',
	KC_PWR: 'KC_SYSTEM_POWER',
	KC_SLEP: 'KC_SYSTEM_SLEEP',
	KC_WAKE: 'KC_SYSTEM_WAKE',
	KC_APP: 'KC_APPLICATION',
	KC_NUHS: 'KC_NONUS_HASH',
	KC_NUBS: 'KC_NONUS_BACKSLASH',
};

const MOD_BITS: Record<string, number> = {
	MOD_LCTL: 0x01,
	MOD_LSFT: 0x02,
	MOD_LALT: 0x04,
	MOD_LGUI: 0x08,
	MOD_RCTL: 0x11,
	MOD_RSFT: 0x12,
	MOD_RALT: 0x14,
	MOD_RGUI: 0x18,
};

function resolveKeycode(name: string): number | null {
	const upper = name.toUpperCase().trim();
	const resolved = ALIASES[upper] ?? upper;
	return nameToCode.get(resolved) ?? null;
}

function parseMod(modStr: string): number | null {
	const parts = modStr.split('|').map((p) => p.trim());
	let bits = 0;
	for (const p of parts) {
		const b = MOD_BITS[p.toUpperCase()];
		if (b === undefined) return null;
		bits |= b;
	}
	return bits;
}

/**
 * Parse a QMK keycode string into its 16-bit numeric value.
 * Returns null if the string cannot be parsed.
 *
 * Supported formats:
 * - Hex: "0x5C16"
 * - Named: "KC_A", "KC_SPC"
 * - LT: "LT(1,KC_SPC)"
 * - MT: "MT(MOD_LSFT,KC_A)"
 * - Layer: "MO(1)", "TG(2)", "TO(0)", "TT(1)", "OSL(1)", "DF(0)"
 * - OSM: "OSM(MOD_LSFT)"
 */
export function parseKeycodeString(input: string): number | null {
	const s = input.trim().toUpperCase();

	if (!s) return null;

	// Hex literal
	if (s.startsWith('0X')) {
		const val = parseInt(s, 16);
		return isNaN(val) || val < 0 || val > 0xffff ? null : val;
	}

	// Decimal literal
	if (/^\d+$/.test(s)) {
		const val = parseInt(s, 10);
		return val >= 0 && val <= 0xffff ? val : null;
	}

	// LT(layer, kc)
	const ltMatch = s.match(/^LT\((\d+)\s*,\s*(.+)\)$/);
	if (ltMatch) {
		const layer = parseInt(ltMatch[1]);
		const kc = resolveKeycode(ltMatch[2]);
		if (layer >= 0 && layer <= 15 && kc !== null && kc <= 0xff) {
			return 0x4000 | (layer << 8) | kc;
		}
		return null;
	}

	// MT(mod, kc)
	const mtMatch = s.match(/^MT\((.+?)\s*,\s*(.+)\)$/);
	if (mtMatch) {
		const modBits = parseMod(mtMatch[1]);
		const kc = resolveKeycode(mtMatch[2]);
		if (modBits !== null && kc !== null && kc <= 0xff) {
			return 0x2000 | (modBits << 8) | kc;
		}
		return null;
	}

	// Layer functions: MO(n), TG(n), TO(n), TT(n), OSL(n), DF(n)
	const layerFuncs: Record<string, number> = {
		MO: 0x5220,
		TG: 0x5260,
		TO: 0x5200,
		TT: 0x52c0,
		OSL: 0x5280,
		DF: 0x5240,
	};
	const layerMatch = s.match(/^(MO|TG|TO|TT|OSL|DF)\((\d+)\)$/);
	if (layerMatch) {
		const base = layerFuncs[layerMatch[1]];
		const layer = parseInt(layerMatch[2]);
		if (layer >= 0 && layer <= 31) return base + layer;
		return null;
	}

	// OSM(mod)
	const osmMatch = s.match(/^OSM\((.+)\)$/);
	if (osmMatch) {
		const modBits = parseMod(osmMatch[1]);
		if (modBits !== null) return 0x52a0 | modBits;
		return null;
	}

	// Plain keycode name lookup
	return resolveKeycode(s);
}
