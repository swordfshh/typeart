/**
 * Byte manipulation helpers for HID protocol work.
 */

/** Read a 16-bit big-endian value from a buffer at the given offset. */
export function readUint16BE(buf: Uint8Array, offset: number): number {
	return (buf[offset] << 8) | buf[offset + 1];
}

/** Write a 16-bit big-endian value to a buffer at the given offset. */
export function writeUint16BE(buf: Uint8Array, offset: number, value: number): void {
	buf[offset] = (value >> 8) & 0xff;
	buf[offset + 1] = value & 0xff;
}

/** Read a 32-bit big-endian value from a buffer at the given offset. */
export function readUint32BE(buf: Uint8Array, offset: number): number {
	return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

/** Write a 32-bit big-endian value to a buffer at the given offset. */
export function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
	buf[offset] = (value >> 24) & 0xff;
	buf[offset + 1] = (value >> 16) & 0xff;
	buf[offset + 2] = (value >> 8) & 0xff;
	buf[offset + 3] = value & 0xff;
}

/** Format a byte array as a hex string for debugging. */
export function toHex(buf: Uint8Array, separator = ' '): string {
	return Array.from(buf)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join(separator);
}
