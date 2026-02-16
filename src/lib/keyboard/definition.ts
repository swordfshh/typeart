/**
 * Keyboard definition loader.
 * Fetches definition JSON files from the static/keyboards/ directory,
 * with fallback to VIA's online definition library (usevia.app).
 */

import type { KeyboardDefinition, KeyboardRegistryEntry, LayoutOption, ParsedKey } from './types.js';

/** Result of finding a definition for a connected device */
export interface DefinitionResult {
	entry?: KeyboardRegistryEntry;
	definition: KeyboardDefinition;
	/** Pre-parsed keys (provided for VIA-fetched definitions that skip KLE parsing) */
	parsedKeys?: ParsedKey[];
}

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
 * Tries local definitions first, then falls back to VIA's online library.
 */
export async function findDefinitionForDevice(
	vendorId: number,
	productId: number
): Promise<DefinitionResult | null> {
	const registry = await fetchKeyboardRegistry();

	// VIA definitions store vendor/product IDs as hex strings like "0x1234"
	const vid = vendorId.toString(16).toLowerCase().padStart(4, '0');
	const pid = productId.toString(16).toLowerCase().padStart(4, '0');

	const entry = registry.find((e) => {
		const eVid = e.vendorId.replace(/^0x/i, '').toLowerCase().padStart(4, '0');
		const ePid = e.productId.replace(/^0x/i, '').toLowerCase().padStart(4, '0');
		return eVid === vid && ePid === pid;
	});

	if (entry) {
		const definition = await fetchKeyboardDefinition(entry.path);
		return { entry, definition };
	}

	// Fallback: try VIA's online definition library
	return fetchViaDefinition(vendorId, productId);
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

// --- VIA online definition fallback ---

/** Key format used by VIA's pre-built definitions (usevia.app) */
interface ViaKey {
	row: number;
	col: number;
	x: number;
	y: number;
	w: number;
	h: number;
	r: number;
	rx: number;
	ry: number;
	d: boolean;
	w2?: number;
	h2?: number;
	x2?: number;
	y2?: number;
}

/** Response format from usevia.app/definitions/{version}/{vpid}.json */
interface ViaDefinitionResponse {
	name: string;
	vendorProductId: number;
	matrix: { rows: number; cols: number };
	layouts: {
		labels?: (string | string[])[];
		keys: ViaKey[];
		optionKeys?: Record<string, Record<string, ViaKey[]>>;
	};
}

/**
 * Fetches a keyboard definition from VIA's online library.
 * Tries v3 first, then v2.
 */
async function fetchViaDefinition(
	vendorId: number,
	productId: number
): Promise<DefinitionResult | null> {
	const vpid = vendorId * 65536 + productId;

	for (const version of ['v3', 'v2']) {
		try {
			const res = await fetch(`https://usevia.app/definitions/${version}/${vpid}.json`);
			if (!res.ok) continue;
			const via: ViaDefinitionResponse = await res.json();
			return convertViaDefinition(via);
		} catch {
			continue;
		}
	}

	return null;
}

/** Converts a VIA pre-parsed definition into TypeArt's format */
function convertViaDefinition(via: ViaDefinitionResponse): DefinitionResult {
	const vendorId = Math.floor(via.vendorProductId / 65536);
	const productId = via.vendorProductId & 0xffff;

	const definition: KeyboardDefinition = {
		name: via.name,
		vendorId: '0x' + vendorId.toString(16).padStart(4, '0'),
		productId: '0x' + productId.toString(16).padStart(4, '0'),
		matrix: via.matrix,
		layouts: {
			labels: via.layouts.labels,
			keymap: []
		}
	};

	const parsedKeys: ParsedKey[] = [];

	// Base keys
	for (const k of via.layouts.keys) {
		if (k.d) continue;
		parsedKeys.push(viaKeyToParsedKey(k, -1, -1));
	}

	// Layout option keys
	if (via.layouts.optionKeys) {
		for (const [group, choices] of Object.entries(via.layouts.optionKeys)) {
			for (const [choice, keys] of Object.entries(choices)) {
				for (const k of keys) {
					if (k.d) continue;
					parsedKeys.push(viaKeyToParsedKey(k, parseInt(group), parseInt(choice)));
				}
			}
		}
	}

	return { definition, parsedKeys };
}

function viaKeyToParsedKey(k: ViaKey, optionGroup: number, optionChoice: number): ParsedKey {
	return {
		row: k.row,
		col: k.col,
		x: k.x,
		y: k.y,
		w: k.w,
		h: k.h,
		w2: k.w2 ?? 0,
		h2: k.h2 ?? 0,
		x2: k.x2 ?? 0,
		y2: k.y2 ?? 0,
		r: k.r,
		rx: k.rx,
		ry: k.ry,
		optionGroup,
		optionChoice
	};
}
