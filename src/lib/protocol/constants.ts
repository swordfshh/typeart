/**
 * VIA protocol constants.
 */

/** Maximum HID report size in bytes */
export const REPORT_SIZE = 32;

/** Bytes available for data in a DynamicKeymapGetBuffer response (32 - 4 header bytes) */
export const BUFFER_CHUNK_SIZE = 28;

/** Size of a keycode in bytes (16-bit big-endian) */
export const KEYCODE_SIZE = 2;

/** Current supported VIA protocol version */
export const PROTOCOL_VERSION = 12;
