/**
 * Keyboard definition state store.
 * Holds the active keyboard definition, parsed layout, and layout options.
 */

import type { KeyboardDefinition, ParsedKey, LayoutOption } from '../keyboard/types.js';
import { parseKLELayout, filterKeysByLayoutOptions } from '../keyboard/kle-parser.js';
import { getLayoutOptions, findDefinitionForDevice, fetchKeyboardDefinition, fetchKeyboardRegistry } from '../keyboard/definition.js';
import type { KeyboardRegistryEntry } from '../keyboard/types.js';

class DefinitionStore {
	/** Current keyboard definition */
	definition: KeyboardDefinition | null = $state(null);
	/** All parsed keys (before layout option filtering) */
	allKeys: ParsedKey[] = $state([]);
	/** Current layout option selections */
	layoutOptionValues: number[] = $state([]);
	/** Available layout options */
	layoutOptions: LayoutOption[] = $state([]);
	/** Available keyboards in registry */
	registry: KeyboardRegistryEntry[] = $state([]);
	/** Loading state */
	loading = $state(false);

	/** Number of encoders defined */
	get encoderCount(): number {
		return this.definition?.encoders?.length ?? 0;
	}

	/** Generate encoder virtual keys from definition */
	get encoderKeys(): ParsedKey[] {
		const encoders = this.definition?.encoders;
		if (!encoders || encoders.length === 0) return [];

		const keys: ParsedKey[] = [];
		for (let i = 0; i < encoders.length; i++) {
			const enc = encoders[i];
			const w = enc.w ?? 1;
			const h = enc.h ?? 1;

			// CCW key (left)
			keys.push({
				row: -1, col: i * 2,
				x: enc.x, y: enc.y, w, h,
				w2: 0, h2: 0, x2: 0, y2: 0,
				r: 0, rx: 0, ry: 0,
				optionGroup: -1, optionChoice: -1,
				encoder: { id: i, direction: 0 }
			});

			// CW key (right, adjacent)
			keys.push({
				row: -1, col: i * 2 + 1,
				x: enc.x + w, y: enc.y, w, h,
				w2: 0, h2: 0, x2: 0, y2: 0,
				r: 0, rx: 0, ry: 0,
				optionGroup: -1, optionChoice: -1,
				encoder: { id: i, direction: 1 }
			});

			// Push button (regular matrix key, centered below CW/CCW)
			if (enc.push) {
				keys.push({
					row: enc.push[0], col: enc.push[1],
					x: enc.x + w * 0.5, y: enc.y + h, w, h,
					w2: 0, h2: 0, x2: 0, y2: 0,
					r: 0, rx: 0, ry: 0,
					optionGroup: -1, optionChoice: -1
				});
			}
		}
		return keys;
	}

	/** Filtered keys based on current layout option selections, plus encoder keys */
	get activeKeys(): ParsedKey[] {
		return [...filterKeysByLayoutOptions(this.allKeys, this.layoutOptionValues), ...this.encoderKeys];
	}

	/** Matrix dimensions */
	get rows(): number {
		return this.definition?.matrix.rows ?? 0;
	}

	get cols(): number {
		return this.definition?.matrix.cols ?? 0;
	}

	/** Registry entry for the currently loaded definition */
	get currentEntry(): KeyboardRegistryEntry | undefined {
		if (!this.definition) return undefined;
		return this.registry.find(
			(e) => e.vendorId === this.definition!.vendorId && e.productId === this.definition!.productId
		);
	}

	/**
	 * Load the keyboard registry.
	 */
	async loadRegistry(): Promise<void> {
		try {
			this.registry = await fetchKeyboardRegistry();
		} catch {
			this.registry = [];
		}
	}

	/**
	 * Load a definition by path from the registry.
	 */
	async loadDefinition(path: string): Promise<void> {
		this.loading = true;
		try {
			const definition = await fetchKeyboardDefinition(path);
			this.setDefinition(definition);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Auto-detect and load definition for a connected device.
	 */
	async loadForDevice(vendorId: number, productId: number): Promise<boolean> {
		this.loading = true;
		try {
			const result = await findDefinitionForDevice(vendorId, productId);
			if (!result) return false;
			this.setDefinition(result.definition);
			return true;
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Set layout option and re-filter keys.
	 */
	setLayoutOption(group: number, choice: number): void {
		const values = [...this.layoutOptionValues];
		values[group] = choice;
		this.layoutOptionValues = values;
	}

	/**
	 * Reset the store.
	 */
	reset(): void {
		this.definition = null;
		this.allKeys = [];
		this.layoutOptionValues = [];
		this.layoutOptions = [];
		this.loading = false;
	}

	private setDefinition(definition: KeyboardDefinition): void {
		this.definition = definition;
		this.allKeys = parseKLELayout(definition.layouts.keymap);
		this.layoutOptions = getLayoutOptions(definition);
		this.layoutOptionValues = this.layoutOptions.map(() => 0);
	}
}

export const definitionStore = new DefinitionStore();
