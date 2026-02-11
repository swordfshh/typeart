/**
 * QMK keycode range definitions.
 * Maps to quantum/keycodes.h in QMK firmware.
 */

export const QK_BASIC_MIN = 0x0000;
export const QK_BASIC_MAX = 0x00ff;

export const QK_MODS_MIN = 0x0100;
export const QK_MODS_MAX = 0x1fff;

export const QK_LAYER_TAP_MIN = 0x4000;
export const QK_LAYER_TAP_MAX = 0x4fff;

export const QK_LAYER_MOD_MIN = 0x5000;
export const QK_LAYER_MOD_MAX = 0x51ff;

export const QK_TO_MIN = 0x5200;
export const QK_TO_MAX = 0x521f;

export const QK_MOMENTARY_MIN = 0x5220;
export const QK_MOMENTARY_MAX = 0x523f;

export const QK_DEF_LAYER_MIN = 0x5240;
export const QK_DEF_LAYER_MAX = 0x525f;

export const QK_TOGGLE_LAYER_MIN = 0x5260;
export const QK_TOGGLE_LAYER_MAX = 0x527f;

export const QK_ONE_SHOT_LAYER_MIN = 0x5280;
export const QK_ONE_SHOT_LAYER_MAX = 0x529f;

export const QK_ONE_SHOT_MOD_MIN = 0x52a0;
export const QK_ONE_SHOT_MOD_MAX = 0x52bf;

export const QK_LAYER_TAP_TOGGLE_MIN = 0x52c0;
export const QK_LAYER_TAP_TOGGLE_MAX = 0x52df;

export const QK_MOD_TAP_MIN = 0x2000;
export const QK_MOD_TAP_MAX = 0x3fff;

export const QK_TAP_DANCE_MIN = 0x5700;
export const QK_TAP_DANCE_MAX = 0x57ff;

export const QK_MACRO_MIN = 0x7700;
export const QK_MACRO_MAX = 0x77ff;

export const QK_BACKLIGHT_MIN = 0x5100;
export const QK_BACKLIGHT_MAX = 0x510f;

export const QK_RGB_MIN = 0x5110;
export const QK_RGB_MAX = 0x511f;

export const QK_MOUSE_MIN = 0x0000; // Mouse keys are in basic range (CD range)
export const QK_MOUSE_MAX = 0x00ff;

// Grave Escape
export const QK_GRAVE_ESCAPE = 0x5c16;

// Space Cadet
export const QK_SPACE_CADET_MIN = 0x5c56;
export const QK_SPACE_CADET_MAX = 0x5c5b;
export const SC_LSPO = 0x5c56;
export const SC_RSPC = 0x5c57;
export const SC_LAPO = 0x5c58;
export const SC_RAPC = 0x5c59;
export const SC_LCPO = 0x5c5a;
export const SC_RCPC = 0x5c5b;

// Special keycodes
export const KC_NO = 0x0000;
export const KC_TRANSPARENT = 0x0001;
