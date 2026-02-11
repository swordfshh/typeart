/**
 * QMK keycode catalog organized by category.
 * Codes match VIA's keycode mapping (key-to-byte/default.ts).
 */

export interface KeycodeEntry {
	code: number;
	name: string;
	label: string;
	/** Short label for key caps (1-4 chars) */
	shortLabel: string;
}

export interface KeycodeCategory {
	name: string;
	keycodes: KeycodeEntry[];
}

function kc(code: number, name: string, label: string, shortLabel?: string): KeycodeEntry {
	return { code, name, label, shortLabel: shortLabel ?? label };
}

// ─── Basic ──────────────────────────────────────────────────────────────────

export const BASIC_KEYCODES: KeycodeEntry[] = [
	// Special
	kc(0x0000, 'KC_NO', 'None', ''),
	kc(0x0001, 'KC_TRANSPARENT', 'Trans', '▽'),

	// Letters
	kc(0x0004, 'KC_A', 'A', 'A'),
	kc(0x0005, 'KC_B', 'B', 'B'),
	kc(0x0006, 'KC_C', 'C', 'C'),
	kc(0x0007, 'KC_D', 'D', 'D'),
	kc(0x0008, 'KC_E', 'E', 'E'),
	kc(0x0009, 'KC_F', 'F', 'F'),
	kc(0x000a, 'KC_G', 'G', 'G'),
	kc(0x000b, 'KC_H', 'H', 'H'),
	kc(0x000c, 'KC_I', 'I', 'I'),
	kc(0x000d, 'KC_J', 'J', 'J'),
	kc(0x000e, 'KC_K', 'K', 'K'),
	kc(0x000f, 'KC_L', 'L', 'L'),
	kc(0x0010, 'KC_M', 'M', 'M'),
	kc(0x0011, 'KC_N', 'N', 'N'),
	kc(0x0012, 'KC_O', 'O', 'O'),
	kc(0x0013, 'KC_P', 'P', 'P'),
	kc(0x0014, 'KC_Q', 'Q', 'Q'),
	kc(0x0015, 'KC_R', 'R', 'R'),
	kc(0x0016, 'KC_S', 'S', 'S'),
	kc(0x0017, 'KC_T', 'T', 'T'),
	kc(0x0018, 'KC_U', 'U', 'U'),
	kc(0x0019, 'KC_V', 'V', 'V'),
	kc(0x001a, 'KC_W', 'W', 'W'),
	kc(0x001b, 'KC_X', 'X', 'X'),
	kc(0x001c, 'KC_Y', 'Y', 'Y'),
	kc(0x001d, 'KC_Z', 'Z', 'Z'),

	// Numbers
	kc(0x001e, 'KC_1', '1', '1'),
	kc(0x001f, 'KC_2', '2', '2'),
	kc(0x0020, 'KC_3', '3', '3'),
	kc(0x0021, 'KC_4', '4', '4'),
	kc(0x0022, 'KC_5', '5', '5'),
	kc(0x0023, 'KC_6', '6', '6'),
	kc(0x0024, 'KC_7', '7', '7'),
	kc(0x0025, 'KC_8', '8', '8'),
	kc(0x0026, 'KC_9', '9', '9'),
	kc(0x0027, 'KC_0', '0', '0'),

	// Editing
	kc(0x0028, 'KC_ENTER', 'Enter', 'Ent'),
	kc(0x0029, 'KC_ESCAPE', 'Escape', 'Esc'),
	kc(0x002a, 'KC_BACKSPACE', 'Backspace', 'Bksp'),
	kc(0x002b, 'KC_TAB', 'Tab', 'Tab'),
	kc(0x002c, 'KC_SPACE', 'Space', 'Spc'),

	// Symbols
	kc(0x002d, 'KC_MINUS', '-', '-'),
	kc(0x002e, 'KC_EQUAL', '=', '='),
	kc(0x002f, 'KC_LEFT_BRACKET', '[', '['),
	kc(0x0030, 'KC_RIGHT_BRACKET', ']', ']'),
	kc(0x0031, 'KC_BACKSLASH', '\\', '\\'),
	kc(0x0032, 'KC_NONUS_HASH', 'Non-US #', '#'),
	kc(0x0033, 'KC_SEMICOLON', ';', ';'),
	kc(0x0034, 'KC_QUOTE', "'", "'"),
	kc(0x0035, 'KC_GRAVE', '`', '`'),
	kc(0x0036, 'KC_COMMA', ',', ','),
	kc(0x0037, 'KC_DOT', '.', '.'),
	kc(0x0038, 'KC_SLASH', '/', '/'),

	// Lock keys
	kc(0x0039, 'KC_CAPS_LOCK', 'Caps Lock', 'Caps'),
	kc(0x0047, 'KC_SCROLL_LOCK', 'Scroll Lock', 'ScrL'),
	kc(0x0053, 'KC_NUM_LOCK', 'Num Lock', 'NmLk'),

	// F1-F12
	kc(0x003a, 'KC_F1', 'F1', 'F1'),
	kc(0x003b, 'KC_F2', 'F2', 'F2'),
	kc(0x003c, 'KC_F3', 'F3', 'F3'),
	kc(0x003d, 'KC_F4', 'F4', 'F4'),
	kc(0x003e, 'KC_F5', 'F5', 'F5'),
	kc(0x003f, 'KC_F6', 'F6', 'F6'),
	kc(0x0040, 'KC_F7', 'F7', 'F7'),
	kc(0x0041, 'KC_F8', 'F8', 'F8'),
	kc(0x0042, 'KC_F9', 'F9', 'F9'),
	kc(0x0043, 'KC_F10', 'F10', 'F10'),
	kc(0x0044, 'KC_F11', 'F11', 'F11'),
	kc(0x0045, 'KC_F12', 'F12', 'F12'),

	// Navigation
	kc(0x0046, 'KC_PRINT_SCREEN', 'Print Screen', 'PScr'),
	kc(0x0048, 'KC_PAUSE', 'Pause', 'Paus'),
	kc(0x0049, 'KC_INSERT', 'Insert', 'Ins'),
	kc(0x004a, 'KC_HOME', 'Home', 'Home'),
	kc(0x004b, 'KC_PAGE_UP', 'Page Up', 'PgUp'),
	kc(0x004c, 'KC_DELETE', 'Delete', 'Del'),
	kc(0x004d, 'KC_END', 'End', 'End'),
	kc(0x004e, 'KC_PAGE_DOWN', 'Page Down', 'PgDn'),
	kc(0x004f, 'KC_RIGHT', 'Right', '→'),
	kc(0x0050, 'KC_LEFT', 'Left', '←'),
	kc(0x0051, 'KC_DOWN', 'Down', '↓'),
	kc(0x0052, 'KC_UP', 'Up', '↑'),

	// Numpad
	kc(0x0054, 'KC_KP_SLASH', 'KP /', 'KP/'),
	kc(0x0055, 'KC_KP_ASTERISK', 'KP *', 'KP*'),
	kc(0x0056, 'KC_KP_MINUS', 'KP -', 'KP-'),
	kc(0x0057, 'KC_KP_PLUS', 'KP +', 'KP+'),
	kc(0x0058, 'KC_KP_ENTER', 'KP Enter', 'KPEn'),
	kc(0x0059, 'KC_KP_1', 'KP 1', 'KP1'),
	kc(0x005a, 'KC_KP_2', 'KP 2', 'KP2'),
	kc(0x005b, 'KC_KP_3', 'KP 3', 'KP3'),
	kc(0x005c, 'KC_KP_4', 'KP 4', 'KP4'),
	kc(0x005d, 'KC_KP_5', 'KP 5', 'KP5'),
	kc(0x005e, 'KC_KP_6', 'KP 6', 'KP6'),
	kc(0x005f, 'KC_KP_7', 'KP 7', 'KP7'),
	kc(0x0060, 'KC_KP_8', 'KP 8', 'KP8'),
	kc(0x0061, 'KC_KP_9', 'KP 9', 'KP9'),
	kc(0x0062, 'KC_KP_0', 'KP 0', 'KP0'),
	kc(0x0063, 'KC_KP_DOT', 'KP .', 'KP.'),
	kc(0x0064, 'KC_NONUS_BACKSLASH', 'Non-US \\', 'NU\\'),
	kc(0x0065, 'KC_APPLICATION', 'App/Menu', 'App'),
	kc(0x0067, 'KC_KP_EQUAL', 'KP =', 'KP='),

	// Modifiers
	kc(0x00e0, 'KC_LEFT_CTRL', 'Left Ctrl', 'LCtl'),
	kc(0x00e1, 'KC_LEFT_SHIFT', 'Left Shift', 'LSft'),
	kc(0x00e2, 'KC_LEFT_ALT', 'Left Alt', 'LAlt'),
	kc(0x00e3, 'KC_LEFT_GUI', 'Left GUI', 'LGui'),
	kc(0x00e4, 'KC_RIGHT_CTRL', 'Right Ctrl', 'RCtl'),
	kc(0x00e5, 'KC_RIGHT_SHIFT', 'Right Shift', 'RSft'),
	kc(0x00e6, 'KC_RIGHT_ALT', 'Right Alt', 'RAlt'),
	kc(0x00e7, 'KC_RIGHT_GUI', 'Right GUI', 'RGui'),
];

// ─── Media / System / Consumer ──────────────────────────────────────────────
// Codes match VIA's key-to-byte mapping

export const MEDIA_KEYCODES: KeycodeEntry[] = [
	// System
	kc(0x00a5, 'KC_SYSTEM_POWER', 'Sys Power', 'Pwr'),
	kc(0x00a6, 'KC_SYSTEM_SLEEP', 'Sys Sleep', 'Slp'),
	kc(0x00a7, 'KC_SYSTEM_WAKE', 'Sys Wake', 'Wake'),

	// Audio
	kc(0x00a8, 'KC_AUDIO_MUTE', 'Mute', 'Mute'),
	kc(0x00a9, 'KC_AUDIO_VOL_UP', 'Vol Up', 'V+'),
	kc(0x00aa, 'KC_AUDIO_VOL_DOWN', 'Vol Down', 'V-'),

	// Transport
	kc(0x00ab, 'KC_MEDIA_NEXT_TRACK', 'Next Track', 'Next'),
	kc(0x00ac, 'KC_MEDIA_PREV_TRACK', 'Prev Track', 'Prev'),
	kc(0x00ad, 'KC_MEDIA_STOP', 'Stop', 'Stop'),
	kc(0x00ae, 'KC_MEDIA_PLAY_PAUSE', 'Play/Pause', 'Play'),
	kc(0x00af, 'KC_MEDIA_SELECT', 'Media Select', 'MSel'),
	kc(0x00b0, 'KC_MEDIA_EJECT', 'Eject', 'Ejct'),
	kc(0x00bb, 'KC_MEDIA_FAST_FORWARD', 'Fast Fwd', 'FFwd'),
	kc(0x00bc, 'KC_MEDIA_REWIND', 'Rewind', 'Rwnd'),

	// Consumer apps
	kc(0x00b1, 'KC_MAIL', 'Mail', 'Mail'),
	kc(0x00b2, 'KC_CALCULATOR', 'Calculator', 'Calc'),
	kc(0x00b3, 'KC_MY_COMPUTER', 'My Computer', 'Comp'),

	// Browser
	kc(0x00b4, 'KC_WWW_SEARCH', 'WWW Search', 'Srch'),
	kc(0x00b5, 'KC_WWW_HOME', 'WWW Home', 'WHom'),
	kc(0x00b6, 'KC_WWW_BACK', 'WWW Back', 'WBak'),
	kc(0x00b7, 'KC_WWW_FORWARD', 'WWW Forward', 'WFwd'),
	kc(0x00b8, 'KC_WWW_STOP', 'WWW Stop', 'WStp'),
	kc(0x00b9, 'KC_WWW_REFRESH', 'WWW Refresh', 'WRef'),
	kc(0x00ba, 'KC_WWW_FAVORITES', 'WWW Fav', 'WFav'),

	// Brightness
	kc(0x00bd, 'KC_BRIGHTNESS_UP', 'Bright Up', 'Br+'),
	kc(0x00be, 'KC_BRIGHTNESS_DOWN', 'Bright Down', 'Br-'),
];

// ─── Macro ──────────────────────────────────────────────────────────────────

export const MACRO_KEYCODES: KeycodeEntry[] = Array.from({ length: 16 }, (_, i) =>
	kc(0x7700 + i, `MACRO_${i}`, `Macro ${i}`, `M${i}`)
);

// ─── Layers ─────────────────────────────────────────────────────────────────

function generateLayerKeycodes(): KeycodeEntry[] {
	const entries: KeycodeEntry[] = [];
	const types = [
		{ prefix: 'MO', base: 0x5220, desc: 'Momentary' },
		{ prefix: 'TG', base: 0x5260, desc: 'Toggle' },
		{ prefix: 'TO', base: 0x5200, desc: 'To Layer' },
		{ prefix: 'TT', base: 0x52c0, desc: 'Tap Toggle' },
		{ prefix: 'OSL', base: 0x5280, desc: 'One Shot Layer' },
		{ prefix: 'DF', base: 0x5240, desc: 'Default Layer' },
	];
	for (const t of types) {
		for (let i = 0; i <= 15; i++) {
			entries.push(kc(t.base + i, `${t.prefix}(${i})`, `${t.desc} ${i}`, `${t.prefix}${i}`));
		}
	}
	return entries;
}

export const LAYER_KEYCODES = generateLayerKeycodes();

// ─── Special ────────────────────────────────────────────────────────────────

export const SPECIAL_KEYCODES: KeycodeEntry[] = [
	// Grave Escape
	kc(0x5c16, 'QK_GESC', 'Grave Escape', 'GEsc'),

	// Space Cadet
	kc(0x5c56, 'SC_LSPO', 'LShift / (', 'LSPO'),
	kc(0x5c57, 'SC_RSPC', 'RShift / )', 'RSPC'),
	kc(0x5c58, 'SC_LAPO', 'LAlt / (', 'LAPO'),
	kc(0x5c59, 'SC_RAPC', 'RAlt / )', 'RAPC'),
	kc(0x5c5a, 'SC_LCPO', 'LCtrl / (', 'LCPO'),
	kc(0x5c5b, 'SC_RCPC', 'RCtrl / )', 'RCPC'),

	// Shifted symbols (QK_MODS: 0x0200 | basic_kc = Left Shift + key)
	kc(0x0235, 'KC_TILD', '~', '~'),
	kc(0x021e, 'KC_EXLM', '!', '!'),
	kc(0x021f, 'KC_AT', '@', '@'),
	kc(0x0220, 'KC_HASH', '#', '#'),
	kc(0x0221, 'KC_DLR', '$', '$'),
	kc(0x0222, 'KC_PERC', '%', '%'),
	kc(0x0223, 'KC_CIRC', '^', '^'),
	kc(0x0224, 'KC_AMPR', '&', '&'),
	kc(0x0225, 'KC_ASTR', '*', '*'),
	kc(0x0226, 'KC_LPRN', '(', '('),
	kc(0x0227, 'KC_RPRN', ')', ')'),
	kc(0x022d, 'KC_UNDS', '_', '_'),
	kc(0x022e, 'KC_PLUS', '+', '+'),
	kc(0x022f, 'KC_LCBR', '{', '{'),
	kc(0x0230, 'KC_RCBR', '}', '}'),
	kc(0x0231, 'KC_PIPE', '|', '|'),
	kc(0x0233, 'KC_COLN', ':', ':'),
	kc(0x0234, 'KC_DQUO', '"', '"'),
	kc(0x0236, 'KC_LABK', '<', '<'),
	kc(0x0237, 'KC_RABK', '>', '>'),
	kc(0x0238, 'KC_QUES', '?', '?'),

	// F13-F24
	kc(0x0068, 'KC_F13', 'F13', 'F13'),
	kc(0x0069, 'KC_F14', 'F14', 'F14'),
	kc(0x006a, 'KC_F15', 'F15', 'F15'),
	kc(0x006b, 'KC_F16', 'F16', 'F16'),
	kc(0x006c, 'KC_F17', 'F17', 'F17'),
	kc(0x006d, 'KC_F18', 'F18', 'F18'),
	kc(0x006e, 'KC_F19', 'F19', 'F19'),
	kc(0x006f, 'KC_F20', 'F20', 'F20'),
	kc(0x0070, 'KC_F21', 'F21', 'F21'),
	kc(0x0071, 'KC_F22', 'F22', 'F22'),
	kc(0x0072, 'KC_F23', 'F23', 'F23'),
	kc(0x0073, 'KC_F24', 'F24', 'F24'),

	// Mouse keys
	kc(0x00cd, 'KC_MS_UP', 'Mouse Up', 'Ms↑'),
	kc(0x00ce, 'KC_MS_DOWN', 'Mouse Down', 'Ms↓'),
	kc(0x00cf, 'KC_MS_LEFT', 'Mouse Left', 'Ms←'),
	kc(0x00d0, 'KC_MS_RIGHT', 'Mouse Right', 'Ms→'),
	kc(0x00d1, 'KC_MS_BTN1', 'Mouse Btn1', 'MsB1'),
	kc(0x00d2, 'KC_MS_BTN2', 'Mouse Btn2', 'MsB2'),
	kc(0x00d3, 'KC_MS_BTN3', 'Mouse Btn3', 'MsB3'),
	kc(0x00d4, 'KC_MS_BTN4', 'Mouse Btn4', 'MsB4'),
	kc(0x00d5, 'KC_MS_BTN5', 'Mouse Btn5', 'MsB5'),
	kc(0x00d8, 'KC_MS_WH_UP', 'Wheel Up', 'Wh↑'),
	kc(0x00d9, 'KC_MS_WH_DOWN', 'Wheel Down', 'Wh↓'),
	kc(0x00da, 'KC_MS_WH_LEFT', 'Wheel Left', 'Wh←'),
	kc(0x00db, 'KC_MS_WH_RIGHT', 'Wheel Right', 'Wh→'),
	kc(0x00dc, 'KC_MS_ACCEL0', 'Accel 0', 'MsA0'),
	kc(0x00dd, 'KC_MS_ACCEL1', 'Accel 1', 'MsA1'),
	kc(0x00de, 'KC_MS_ACCEL2', 'Accel 2', 'MsA2'),

	// Quantum
	kc(0x5c00, 'QK_BOOTLOADER', 'Bootloader', 'Boot'),
	kc(0x5c01, 'QK_REBOOT', 'Reboot', 'Rbt'),
	kc(0x5c10, 'QK_DEBUG_TOGGLE', 'Debug Toggle', 'Dbg'),
	kc(0x5c11, 'QK_CLEAR_EEPROM', 'Clear EEPROM', 'ClEE'),
	kc(0x5c12, 'QK_MAKE', 'Make', 'Make'),
];

// ─── Lighting ───────────────────────────────────────────────────────────────

export const LIGHTING_KEYCODES: KeycodeEntry[] = [
	// Backlight
	kc(0x5100, 'BL_TOGG', 'BL Toggle', 'BLTg'),
	kc(0x5101, 'BL_STEP', 'BL Step', 'BLSt'),
	kc(0x5102, 'BL_ON', 'BL On', 'BLOn'),
	kc(0x5103, 'BL_OFF', 'BL Off', 'BLOf'),
	kc(0x5104, 'BL_UP', 'BL Up', 'BL+'),
	kc(0x5105, 'BL_DOWN', 'BL Down', 'BL-'),

	// RGB
	kc(0x5110, 'RGB_TOG', 'RGB Toggle', 'RTog'),
	kc(0x5111, 'RGB_MODE_FORWARD', 'RGB Mode+', 'RM+'),
	kc(0x5112, 'RGB_MODE_REVERSE', 'RGB Mode-', 'RM-'),
	kc(0x5113, 'RGB_HUI', 'RGB Hue+', 'RH+'),
	kc(0x5114, 'RGB_HUD', 'RGB Hue-', 'RH-'),
	kc(0x5115, 'RGB_SAI', 'RGB Sat+', 'RS+'),
	kc(0x5116, 'RGB_SAD', 'RGB Sat-', 'RS-'),
	kc(0x5117, 'RGB_VAI', 'RGB Val+', 'RV+'),
	kc(0x5118, 'RGB_VAD', 'RGB Val-', 'RV-'),
	kc(0x5119, 'RGB_SPI', 'RGB Speed+', 'RSp+'),
	kc(0x511a, 'RGB_SPD', 'RGB Speed-', 'RSp-'),
];

// ─── Categories ─────────────────────────────────────────────────────────────

export const KEYCODE_CATEGORIES: KeycodeCategory[] = [
	{ name: 'Basic', keycodes: BASIC_KEYCODES },
	{ name: 'Media', keycodes: MEDIA_KEYCODES },
	{ name: 'Macro', keycodes: MACRO_KEYCODES },
	{ name: 'Layers', keycodes: LAYER_KEYCODES },
	{ name: 'Special', keycodes: SPECIAL_KEYCODES },
	{ name: 'Lighting', keycodes: LIGHTING_KEYCODES },
];

/**
 * Flat lookup map: keycode → entry
 */
const keycodeMap = new Map<number, KeycodeEntry>();
for (const cat of KEYCODE_CATEGORIES) {
	for (const entry of cat.keycodes) {
		keycodeMap.set(entry.code, entry);
	}
}

/**
 * Look up a keycode entry by its numeric value.
 */
export function getKeycodeEntry(code: number): KeycodeEntry | undefined {
	return keycodeMap.get(code);
}
