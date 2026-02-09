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

	/** Filtered keys based on current layout option selections */
	get activeKeys(): ParsedKey[] {
		return filterKeysByLayoutOptions(this.allKeys, this.layoutOptionValues);
	}

	/** Matrix dimensions */
	get rows(): number {
		return this.definition?.matrix.rows ?? 0;
	}

	get cols(): number {
		return this.definition?.matrix.cols ?? 0;
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
