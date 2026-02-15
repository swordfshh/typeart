/**
 * Types for keyboard definitions and parsed layouts.
 */

/** A single key's position and size in the rendered layout */
export interface ParsedKey {
	/** Matrix row */
	row: number;
	/** Matrix column */
	col: number;
	/** X position in key units (1u = 1.0) */
	x: number;
	/** Y position in key units */
	y: number;
	/** Width in key units (default 1) */
	w: number;
	/** Height in key units (default 1) */
	h: number;
	/** Secondary width (for ISO enter etc.) */
	w2: number;
	/** Secondary height */
	h2: number;
	/** Secondary x offset */
	x2: number;
	/** Secondary y offset */
	y2: number;
	/** Rotation angle in degrees */
	r: number;
	/** Rotation origin X */
	rx: number;
	/** Rotation origin Y */
	ry: number;
	/** Layout option group index (-1 if not an option key) */
	optionGroup: number;
	/** Layout option choice index */
	optionChoice: number;
	/** If present, this key represents an encoder action */
	encoder?: {
		id: number;
		direction: 0 | 1;
	};
}

/** Visual placement of a rotary encoder on the layout */
export interface EncoderDefinition {
	x: number;
	y: number;
	w?: number;
	h?: number;
	/** Matrix [row, col] of the encoder push button (if it has one) */
	push?: [number, number];
}

/** VIA v3 keyboard definition format */
export interface KeyboardDefinition {
	name: string;
	vendorId: string;
	productId: string;
	matrix: {
		rows: number;
		cols: number;
	};
	encoders?: EncoderDefinition[];
	layouts: {
		labels?: (string | string[])[];
		keymap: KLERow[];
	};
}

/**
 * A row in KLE JSON format.
 * Each row is an array of strings (key labels) and objects (key properties).
 */
export type KLERow = (string | KLEKeyProperties)[];

/** Properties that can appear before a key in KLE JSON */
export interface KLEKeyProperties {
	x?: number;
	y?: number;
	w?: number;
	h?: number;
	w2?: number;
	h2?: number;
	x2?: number;
	y2?: number;
	r?: number;
	rx?: number;
	ry?: number;
	/** Decal key (not a real key) */
	d?: boolean;
}

/** Registry entry for a keyboard in index.json */
export interface KeyboardRegistryEntry {
	name: string;
	path: string;
	vendorId: string;
	productId: string;
	firmware?: string;
	firmwareSha256?: string;
}

/** Layout option definition */
export interface LayoutOption {
	/** Display label for this option group */
	label: string;
	/** Available choices (first is default) */
	choices: string[];
}
