/**
 * Keymap state store.
 * Manages the 3D keymap array, encoder keycodes, active layer, selected key, and keycode writes.
 */

import { deviceStore } from './device.svelte.js';
import type { ParsedKey } from '../keyboard/types.js';

export interface SelectedKey {
	layer: number;
	row: number;
	col: number;
	key: ParsedKey;
}

class KeymapStore {
	/** 3D keymap: [layer][row][col] = 16-bit keycode */
	keymap: number[][][] = $state([]);
	/** Encoder keycodes: [layer][encoderId][direction] (0=CCW, 1=CW) */
	encoderKeymap: number[][][] = $state([]);
	/** Currently active layer index */
	activeLayer = $state(0);
	/** Currently selected key (null if none) */
	selectedKey: SelectedKey | null = $state(null);
	/** Number of layers */
	layerCount = $state(0);
	/** Number of encoders */
	encoderCount = $state(0);
	/** Loading state */
	loading = $state(false);

	/**
	 * Load the full keymap from the connected device.
	 */
	async loadFromDevice(rows: number, cols: number, encoderCount: number = 0): Promise<void> {
		const protocol = deviceStore.protocol;
		if (!protocol) return;

		this.loading = true;
		try {
			const layers = await protocol.getLayerCount();
			this.layerCount = layers;
			this.encoderCount = encoderCount;
			this.keymap = await protocol.getFullKeymap(layers, rows, cols);

			// Load encoder keycodes (best-effort — don't fail the whole load)
			if (encoderCount > 0) {
				try {
					const encMap: number[][][] = [];
					for (let layer = 0; layer < layers; layer++) {
						const layerEnc: number[][] = [];
						for (let enc = 0; enc < encoderCount; enc++) {
							const ccw = await protocol.getEncoderKeycode(layer, enc, 0);
							const cw = await protocol.getEncoderKeycode(layer, enc, 1);
							layerEnc.push([ccw, cw]);
						}
						encMap.push(layerEnc);
					}
					this.encoderKeymap = encMap;
				} catch {
					// Firmware may not support encoder commands — default to zeros
					this.encoderKeymap = Array.from({ length: layers }, () =>
						Array.from({ length: encoderCount }, () => [0, 0])
					);
				}
			} else {
				this.encoderKeymap = [];
			}

			this.activeLayer = 0;
			this.selectedKey = null;
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Get the keycode for a specific matrix position.
	 */
	getKeycode(layer: number, row: number, col: number): number {
		return this.keymap[layer]?.[row]?.[col] ?? 0;
	}

	/**
	 * Get keycode for any ParsedKey (matrix or encoder).
	 */
	getKeycodeForKey(layer: number, key: ParsedKey): number {
		if (key.encoder) {
			return this.encoderKeymap[layer]?.[key.encoder.id]?.[key.encoder.direction] ?? 0;
		}
		return this.getKeycode(layer, key.row, key.col);
	}

	/**
	 * Set a keycode at the given matrix position.
	 * Writes to device immediately (optimistic update).
	 */
	async setKeycode(layer: number, row: number, col: number, keycode: number): Promise<void> {
		// Optimistic update
		if (this.keymap[layer]?.[row]) {
			this.keymap[layer][row][col] = keycode;
		}

		// Write to device
		const protocol = deviceStore.protocol;
		if (protocol) {
			await protocol.setKeycode(layer, row, col, keycode);
		}
	}

	/**
	 * Set an encoder keycode. Writes to device immediately (optimistic update).
	 */
	async setEncoderKeycode(
		layer: number,
		encoderId: number,
		direction: number,
		keycode: number
	): Promise<void> {
		if (this.encoderKeymap[layer]?.[encoderId]) {
			this.encoderKeymap[layer][encoderId][direction] = keycode;
		}

		const protocol = deviceStore.protocol;
		if (protocol) {
			await protocol.setEncoderKeycode(layer, encoderId, direction, keycode);
		}
	}

	/**
	 * Set keycode for the currently selected key (matrix or encoder).
	 */
	async setKeycodeForSelected(keycode: number): Promise<void> {
		const sel = this.selectedKey;
		if (!sel) return;
		if (sel.key.encoder) {
			await this.setEncoderKeycode(
				sel.layer,
				sel.key.encoder.id,
				sel.key.encoder.direction,
				keycode
			);
		} else {
			await this.setKeycode(sel.layer, sel.row, sel.col, keycode);
		}
	}

	/**
	 * Select a key for editing.
	 */
	selectKey(key: ParsedKey): void {
		this.selectedKey = {
			layer: this.activeLayer,
			row: key.row,
			col: key.col,
			key
		};
	}

	/**
	 * Deselect the current key.
	 */
	deselectKey(): void {
		this.selectedKey = null;
	}

	/**
	 * Switch to a different layer.
	 */
	setActiveLayer(layer: number): void {
		this.activeLayer = layer;
		this.selectedKey = null;
	}

	/**
	 * Import a keymap from a 3D array.
	 */
	async importKeymap(keymap: number[][][], encoderKeymap?: number[][][]): Promise<void> {
		this.keymap = keymap;
		this.layerCount = keymap.length;

		// Write all keycodes to device
		const protocol = deviceStore.protocol;
		if (!protocol) return;

		for (let layer = 0; layer < keymap.length; layer++) {
			for (let row = 0; row < keymap[layer].length; row++) {
				for (let col = 0; col < keymap[layer][row].length; col++) {
					await protocol.setKeycode(layer, row, col, keymap[layer][row][col]);
				}
			}
		}

		if (encoderKeymap) {
			this.encoderKeymap = encoderKeymap;
			for (let layer = 0; layer < encoderKeymap.length; layer++) {
				for (let enc = 0; enc < encoderKeymap[layer].length; enc++) {
					for (let dir = 0; dir < encoderKeymap[layer][enc].length; dir++) {
						await protocol.setEncoderKeycode(layer, enc, dir, encoderKeymap[layer][enc][dir]);
					}
				}
			}
		}
	}

	/**
	 * Reset the store.
	 */
	reset(): void {
		this.keymap = [];
		this.encoderKeymap = [];
		this.activeLayer = 0;
		this.selectedKey = null;
		this.layerCount = 0;
		this.encoderCount = 0;
		this.loading = false;
	}
}

export const keymapStore = new KeymapStore();
