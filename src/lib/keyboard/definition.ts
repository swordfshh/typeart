/**
 * Keyboard definition loader.
 * Fetches definition JSON files from the static/keyboards/ directory.
 */

import type { KeyboardDefinition, KeyboardRegistryEntry, LayoutOption } from './types.js';

/**
 * Fetches the keyboard registry (list of available definitions).
 */
export async function fetchKeyboardRegistry(): Promise<KeyboardRegistryEntry[]> {
	const res = await fetch('/keyboards/index.json');
	if (!res.ok) throw new Error(`Failed to fetch keyboard registry: ${res.status}`);
	return res.json();
}

/**
 * Fetches a keyboard definition by path.
 */
export async function fetchKeyboardDefinition(path: string): Promise<KeyboardDefinition> {
	const res = await fetch(`/keyboards/${path}/definition.json`);
	if (!res.ok) throw new Error(`Failed to fetch definition for ${path}: ${res.status}`);
	return res.json();
}

/**
 * Finds a keyboard definition matching the given vendorId and productId.
 */
export async function findDefinitionForDevice(
	vendorId: number,
	productId: number
): Promise<{ entry: KeyboardRegistryEntry; definition: KeyboardDefinition } | null> {
	const registry = await fetchKeyboardRegistry();

	// VIA definitions store vendor/product IDs as hex strings like "0x1234"
	const vid = '0x' + vendorId.toString(16).toUpperCase().padStart(4, '0');
	const pid = '0x' + productId.toString(16).toUpperCase().padStart(4, '0');

	const entry = registry.find((e) => {
		return e.vendorId.toUpperCase() === vid || e.productId.toUpperCase() === pid;
	});

	if (!entry) return null;

	const definition = await fetchKeyboardDefinition(entry.path);
	return { entry, definition };
}

/**
 * Extracts layout option definitions from a keyboard definition.
 */
export function getLayoutOptions(definition: KeyboardDefinition): LayoutOption[] {
	if (!definition.layouts.labels) return [];

	return definition.layouts.labels.map((label) => {
		if (typeof label === 'string') {
			// Simple toggle: label is the group name, choices are Off/On
			return { label, choices: ['Off', 'On'] };
		}
		// Array: first element is label, rest are choices
		return { label: label[0], choices: label.slice(1) };
	});
}
