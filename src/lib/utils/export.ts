/**
 * Keymap import/export utilities.
 * Exports keymaps as JSON for backup/sharing.
 */

export interface ExportedKeymap {
	version: 1;
	name: string;
	vendorId: string;
	productId: string;
	layers: number;
	rows: number;
	cols: number;
	keymap: number[][][];
	encoders?: number[][][];
}

/**
 * Export a keymap to a JSON-serializable object.
 */
export function exportKeymap(
	name: string,
	vendorId: string,
	productId: string,
	keymap: number[][][],
	encoderKeymap?: number[][][]
): ExportedKeymap {
	const layers = keymap.length;
	const rows = keymap[0]?.length ?? 0;
	const cols = keymap[0]?.[0]?.length ?? 0;

	const result: ExportedKeymap = {
		version: 1,
		name,
		vendorId,
		productId,
		layers,
		rows,
		cols,
		keymap
	};

	if (encoderKeymap && encoderKeymap.length > 0) {
		result.encoders = encoderKeymap;
	}

	return result;
}

/**
 * Validate and parse an imported keymap JSON.
 */
export function parseImportedKeymap(json: string): ExportedKeymap {
	const data = JSON.parse(json);

	if (data.version !== 1) {
		throw new Error(`Unsupported keymap version: ${data.version}`);
	}
	if (!Array.isArray(data.keymap)) {
		throw new Error('Invalid keymap data: missing keymap array');
	}
	if (data.keymap.length !== data.layers) {
		throw new Error(`Layer count mismatch: expected ${data.layers}, got ${data.keymap.length}`);
	}

	return data as ExportedKeymap;
}

/**
 * Trigger a JSON file download in the browser.
 */
export function downloadJson(data: unknown, filename: string): void {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
