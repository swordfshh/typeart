/**
 * VIA protocol encoder/decoder.
 * Builds 32-byte HID command buffers and parses responses.
 */

import type { HIDTransport } from '../transport/hid-transport.js';
import { ViaCommand, KeyboardValue } from './commands.js';
import { BUFFER_CHUNK_SIZE, KEYCODE_SIZE } from './constants.js';

export class ViaProtocol {
	constructor(private transport: HIDTransport) {}

	/**
	 * Get the VIA protocol version from the keyboard.
	 * Returns a number like 12 for protocol V12.
	 */
	async getProtocolVersion(): Promise<number> {
		const res = await this.send(ViaCommand.GetProtocolVersion);
		return (res[1] << 8) | res[2];
	}

	/**
	 * Get the number of layers supported by the keyboard.
	 */
	async getLayerCount(): Promise<number> {
		const res = await this.send(ViaCommand.DynamicKeymapGetLayerCount);
		return res[1];
	}

	/**
	 * Get a single keycode at the given layer/row/col position.
	 * Returns a 16-bit keycode.
	 */
	async getKeycode(layer: number, row: number, col: number): Promise<number> {
		const res = await this.send(ViaCommand.DynamicKeymapGetKeycode, [layer, row, col]);
		return (res[4] << 8) | res[5];
	}

	/**
	 * Set a single keycode at the given layer/row/col position.
	 */
	async setKeycode(layer: number, row: number, col: number, keycode: number): Promise<void> {
		await this.send(ViaCommand.DynamicKeymapSetKeycode, [
			layer,
			row,
			col,
			(keycode >> 8) & 0xff,
			keycode & 0xff
		]);
	}

	/**
	 * Read the full keymap using bulk buffer reads.
	 * Returns a 3D array: keymap[layer][row][col] = keycode (16-bit)
	 */
	async getFullKeymap(
		layers: number,
		rows: number,
		cols: number
	): Promise<number[][][]> {
		const totalKeycodes = layers * rows * cols;
		const totalBytes = totalKeycodes * KEYCODE_SIZE;

		// Read entire keymap buffer in chunks of BUFFER_CHUNK_SIZE bytes
		const buffer = new Uint8Array(totalBytes);
		let offset = 0;

		while (offset < totalBytes) {
			const remaining = totalBytes - offset;
			const chunkSize = Math.min(BUFFER_CHUNK_SIZE, remaining);

			const res = await this.send(ViaCommand.DynamicKeymapGetBuffer, [
				(offset >> 8) & 0xff,
				offset & 0xff,
				chunkSize
			]);

			// Response: [cmd, offset_hi, offset_lo, size, ...data]
			buffer.set(res.subarray(4, 4 + chunkSize), offset);
			offset += chunkSize;
		}

		// Parse buffer into 3D keycode array
		const keymap: number[][][] = [];
		let byteIdx = 0;

		for (let layer = 0; layer < layers; layer++) {
			const layerData: number[][] = [];
			for (let row = 0; row < rows; row++) {
				const rowData: number[] = [];
				for (let col = 0; col < cols; col++) {
					const hi = buffer[byteIdx];
					const lo = buffer[byteIdx + 1];
					rowData.push((hi << 8) | lo);
					byteIdx += 2;
				}
				layerData.push(rowData);
			}
			keymap.push(layerData);
		}

		return keymap;
	}

	/**
	 * Get the current layout options bitmask.
	 */
	async getLayoutOptions(): Promise<number> {
		const res = await this.send(ViaCommand.GetKeyboardValue, [KeyboardValue.LayoutOptions]);
		return (res[2] << 24) | (res[3] << 16) | (res[4] << 8) | res[5];
	}

	/**
	 * Set the layout options bitmask.
	 */
	async setLayoutOptions(options: number): Promise<void> {
		await this.send(ViaCommand.SetKeyboardValue, [
			KeyboardValue.LayoutOptions,
			(options >> 24) & 0xff,
			(options >> 16) & 0xff,
			(options >> 8) & 0xff,
			options & 0xff
		]);
	}

	/**
	 * Get the switch matrix state (which keys are physically pressed).
	 * Returns a byte array where each bit represents a key in the matrix.
	 */
	async getSwitchMatrixState(): Promise<Uint8Array> {
		const res = await this.send(ViaCommand.GetKeyboardValue, [KeyboardValue.SwitchMatrixState]);
		// Skip cmd byte, keyboard value byte, and row offset byte
		return res.subarray(3);
	}

	/**
	 * Get firmware version.
	 */
	async getFirmwareVersion(): Promise<number> {
		const res = await this.send(ViaCommand.GetKeyboardValue, [KeyboardValue.FirmwareVersion]);
		return (res[2] << 24) | (res[3] << 16) | (res[4] << 8) | res[5];
	}

	/**
	 * Get the keycode assigned to an encoder action.
	 */
	async getEncoderKeycode(layer: number, encoderId: number, direction: number): Promise<number> {
		const res = await this.send(ViaCommand.DynamicKeymapGetEncoder, [layer, encoderId, direction]);
		return (res[4] << 8) | res[5];
	}

	/**
	 * Set the keycode assigned to an encoder action.
	 */
	async setEncoderKeycode(
		layer: number,
		encoderId: number,
		direction: number,
		keycode: number
	): Promise<void> {
		await this.send(ViaCommand.DynamicKeymapSetEncoder, [
			layer,
			encoderId,
			direction,
			(keycode >> 8) & 0xff,
			keycode & 0xff
		]);
	}

	/**
	 * Send a raw VIA command and return the response.
	 */
	private async send(command: ViaCommand, args: number[] = []): Promise<Uint8Array> {
		const data = new Uint8Array(32);
		data[0] = command;
		for (let i = 0; i < args.length; i++) {
			data[i + 1] = args[i];
		}
		return this.transport.sendCommand(data);
	}
}
