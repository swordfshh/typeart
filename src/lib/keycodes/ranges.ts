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
