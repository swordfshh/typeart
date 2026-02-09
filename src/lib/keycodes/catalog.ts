/**
 * QMK keycode catalog organized by category.
 * This covers the most commonly used keycodes.
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

export const BASIC_KEYCODES: KeycodeEntry[] = [
	kc(0x0000, 'KC_NO', 'None', ''),
	kc(0x0001, 'KC_TRANSPARENT', 'Trans', '▽'),
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
	kc(0x0028, 'KC_ENTER', 'Enter', 'Ent'),
	kc(0x0029, 'KC_ESCAPE', 'Escape', 'Esc'),
	kc(0x002a, 'KC_BACKSPACE', 'Backspace', 'Bksp'),
	kc(0x002b, 'KC_TAB', 'Tab', 'Tab'),
	kc(0x002c, 'KC_SPACE', 'Space', 'Spc'),
	kc(0x002d, 'KC_MINUS', '-', '-'),
	kc(0x002e, 'KC_EQUAL', '=', '='),
	kc(0x002f, 'KC_LEFT_BRACKET', '[', '['),
	kc(0x0030, 'KC_RIGHT_BRACKET', ']', ']'),
	kc(0x0031, 'KC_BACKSLASH', '\\', '\\'),
	kc(0x0033, 'KC_SEMICOLON', ';', ';'),
	kc(0x0034, 'KC_QUOTE', "'", "'"),
	kc(0x0035, 'KC_GRAVE', '`', '`'),
	kc(0x0036, 'KC_COMMA', ',', ','),
	kc(0x0037, 'KC_DOT', '.', '.'),
	kc(0x0038, 'KC_SLASH', '/', '/'),
	kc(0x0039, 'KC_CAPS_LOCK', 'Caps Lock', 'Caps')
];

export const MODIFIER_KEYCODES: KeycodeEntry[] = [
	kc(0x00e0, 'KC_LEFT_CTRL', 'Left Ctrl', 'LCtl'),
	kc(0x00e1, 'KC_LEFT_SHIFT', 'Left Shift', 'LSft'),
	kc(0x00e2, 'KC_LEFT_ALT', 'Left Alt', 'LAlt'),
	kc(0x00e3, 'KC_LEFT_GUI', 'Left GUI', 'LGui'),
	kc(0x00e4, 'KC_RIGHT_CTRL', 'Right Ctrl', 'RCtl'),
	kc(0x00e5, 'KC_RIGHT_SHIFT', 'Right Shift', 'RSft'),
	kc(0x00e6, 'KC_RIGHT_ALT', 'Right Alt', 'RAlt'),
	kc(0x00e7, 'KC_RIGHT_GUI', 'Right GUI', 'RGui')
];

export const NAVIGATION_KEYCODES: KeycodeEntry[] = [
	kc(0x003a, 'KC_PRINT_SCREEN', 'Print Screen', 'PScr'),
	kc(0x0047, 'KC_SCROLL_LOCK', 'Scroll Lock', 'ScrL'),
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
	kc(0x0052, 'KC_UP', 'Up', '↑')
];

export const FUNCTION_KEYCODES: KeycodeEntry[] = [
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
	kc(0x0073, 'KC_F24', 'F24', 'F24')
];

export const NUMPAD_KEYCODES: KeycodeEntry[] = [
	kc(0x0053, 'KC_NUM_LOCK', 'Num Lock', 'NmLk'),
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
	kc(0x0067, 'KC_KP_EQUAL', 'KP =', 'KP=')
];

export const MEDIA_KEYCODES: KeycodeEntry[] = [
	kc(0x00a5, 'KC_AUDIO_VOL_UP', 'Vol Up', 'V+'),
	kc(0x00a6, 'KC_AUDIO_VOL_DOWN', 'Vol Down', 'V-'),
	kc(0x00a7, 'KC_AUDIO_MUTE', 'Mute', 'Mute'),
	kc(0x00a8, 'KC_MEDIA_NEXT_TRACK', 'Next', 'Next'),
	kc(0x00a9, 'KC_MEDIA_PREV_TRACK', 'Prev', 'Prev'),
	kc(0x00aa, 'KC_MEDIA_STOP', 'Stop', 'Stop'),
	kc(0x00ab, 'KC_MEDIA_PLAY_PAUSE', 'Play', 'Play'),
	kc(0x00b5, 'KC_BRIGHTNESS_UP', 'Bright Up', 'Br+'),
	kc(0x00b6, 'KC_BRIGHTNESS_DOWN', 'Bright Down', 'Br-')
];

export const LAYER_KEYCODES: KeycodeEntry[] = [
	// MO(layer) — momentary layer activation
	kc(0x5220, 'MO(0)', 'MO(0)', 'MO0'),
	kc(0x5221, 'MO(1)', 'MO(1)', 'MO1'),
	kc(0x5222, 'MO(2)', 'MO(2)', 'MO2'),
	kc(0x5223, 'MO(3)', 'MO(3)', 'MO3'),
	kc(0x5224, 'MO(4)', 'MO(4)', 'MO4'),
	kc(0x5225, 'MO(5)', 'MO(5)', 'MO5'),
	kc(0x5226, 'MO(6)', 'MO(6)', 'MO6'),
	kc(0x5227, 'MO(7)', 'MO(7)', 'MO7'),

	// TG(layer) — toggle layer
	kc(0x5260, 'TG(0)', 'TG(0)', 'TG0'),
	kc(0x5261, 'TG(1)', 'TG(1)', 'TG1'),
	kc(0x5262, 'TG(2)', 'TG(2)', 'TG2'),
	kc(0x5263, 'TG(3)', 'TG(3)', 'TG3'),
	kc(0x5264, 'TG(4)', 'TG(4)', 'TG4'),
	kc(0x5265, 'TG(5)', 'TG(5)', 'TG5'),
	kc(0x5266, 'TG(6)', 'TG(6)', 'TG6'),
	kc(0x5267, 'TG(7)', 'TG(7)', 'TG7'),

	// TO(layer) — switch to layer
	kc(0x5200, 'TO(0)', 'TO(0)', 'TO0'),
	kc(0x5201, 'TO(1)', 'TO(1)', 'TO1'),
	kc(0x5202, 'TO(2)', 'TO(2)', 'TO2'),
	kc(0x5203, 'TO(3)', 'TO(3)', 'TO3'),

	// TT(layer) — layer tap toggle
	kc(0x52c0, 'TT(0)', 'TT(0)', 'TT0'),
	kc(0x52c1, 'TT(1)', 'TT(1)', 'TT1'),
	kc(0x52c2, 'TT(2)', 'TT(2)', 'TT2'),
	kc(0x52c3, 'TT(3)', 'TT(3)', 'TT3'),

	// OSL(layer) — one shot layer
	kc(0x5280, 'OSL(0)', 'OSL(0)', 'OSL0'),
	kc(0x5281, 'OSL(1)', 'OSL(1)', 'OSL1'),
	kc(0x5282, 'OSL(2)', 'OSL(2)', 'OSL2'),
	kc(0x5283, 'OSL(3)', 'OSL(3)', 'OSL3'),

	// DF(layer) — default layer
	kc(0x5240, 'DF(0)', 'DF(0)', 'DF0'),
	kc(0x5241, 'DF(1)', 'DF(1)', 'DF1'),
	kc(0x5242, 'DF(2)', 'DF(2)', 'DF2'),
	kc(0x5243, 'DF(3)', 'DF(3)', 'DF3')
];

export const QUANTUM_KEYCODES: KeycodeEntry[] = [
	kc(0x5c00, 'QK_BOOTLOADER', 'Bootloader', 'Boot'),
	kc(0x5c01, 'QK_REBOOT', 'Reboot', 'Rbt'),
	kc(0x5c10, 'QK_DEBUG_TOGGLE', 'Debug Toggle', 'Dbg'),
	kc(0x5c11, 'QK_CLEAR_EEPROM', 'Clear EEPROM', 'ClEE'),
	kc(0x5c12, 'QK_MAKE', 'Make', 'Make')
];

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
	kc(0x511a, 'RGB_SPD', 'RGB Speed-', 'RSp-')
];

export const MOUSE_KEYCODES: KeycodeEntry[] = [
	kc(0x00cd, 'KC_MS_UP', 'Mouse Up', 'Ms↑'),
	kc(0x00ce, 'KC_MS_DOWN', 'Mouse Down', 'Ms↓'),
	kc(0x00cf, 'KC_MS_LEFT', 'Mouse Left', 'Ms←'),
	kc(0x00d0, 'KC_MS_RIGHT', 'Mouse Right', 'Ms→'),
	kc(0x00d1, 'KC_MS_BTN1', 'Mouse Btn1', 'MsB1'),
	kc(0x00d2, 'KC_MS_BTN2', 'Mouse Btn2', 'MsB2'),
	kc(0x00d3, 'KC_MS_BTN3', 'Mouse Btn3', 'MsB3'),
	kc(0x00d8, 'KC_MS_WH_UP', 'Wheel Up', 'Wh↑'),
	kc(0x00d9, 'KC_MS_WH_DOWN', 'Wheel Down', 'Wh↓')
];

/**
 * All keycode categories in display order.
 */
export const KEYCODE_CATEGORIES: KeycodeCategory[] = [
	{ name: 'Basic', keycodes: BASIC_KEYCODES },
	{ name: 'Modifiers', keycodes: MODIFIER_KEYCODES },
	{ name: 'Navigation', keycodes: NAVIGATION_KEYCODES },
	{ name: 'Function', keycodes: FUNCTION_KEYCODES },
	{ name: 'Numpad', keycodes: NUMPAD_KEYCODES },
	{ name: 'Media', keycodes: MEDIA_KEYCODES },
	{ name: 'Layers', keycodes: LAYER_KEYCODES },
	{ name: 'Quantum', keycodes: QUANTUM_KEYCODES },
	{ name: 'Lighting', keycodes: LIGHTING_KEYCODES },
	{ name: 'Mouse', keycodes: MOUSE_KEYCODES }
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
