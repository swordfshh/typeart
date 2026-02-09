/**
 * Keymap state store.
 * Manages the 3D keymap array, active layer, selected key, and keycode writes.
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
	/** Currently active layer index */
	activeLayer = $state(0);
	/** Currently selected key (null if none) */
	selectedKey: SelectedKey | null = $state(null);
	/** Number of layers */
	layerCount = $state(0);
	/** Loading state */
	loading = $state(false);

	/**
	 * Load the full keymap from the connected device.
	 */
	async loadFromDevice(rows: number, cols: number): Promise<void> {
		const protocol = deviceStore.protocol;
		if (!protocol) return;

		this.loading = true;
		try {
			const layers = await protocol.getLayerCount();
			this.layerCount = layers;
			this.keymap = await protocol.getFullKeymap(layers, rows, cols);
			this.activeLayer = 0;
			this.selectedKey = null;
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Get the keycode for a specific position.
	 */
	getKeycode(layer: number, row: number, col: number): number {
		return this.keymap[layer]?.[row]?.[col] ?? 0;
	}

	/**
	 * Set a keycode at the given position.
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
	async importKeymap(keymap: number[][][]): Promise<void> {
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
	}

	/**
	 * Reset the store.
	 */
	reset(): void {
		this.keymap = [];
		this.activeLayer = 0;
		this.selectedKey = null;
		this.layerCount = 0;
		this.loading = false;
	}
}

export const keymapStore = new KeymapStore();
