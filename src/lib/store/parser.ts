import type { Product, ColorOption, StabilizerOption, SpecItem } from './types.js';

/**
 * Parse the products.txt format into Product objects.
 * Line-based state machine: splits by ---, parses key-value pairs and indented lists.
 */
export function parseProducts(text: string): Product[] {
	const normalized = text.replace(/\r\n/g, '\n');
	const blocks = normalized.split(/\n---\n/);
	const products: Product[] = [];

	for (const block of blocks) {
		const product = parseBlock(block.trim());
		if (product) products.push(product);
	}

	return products;
}

type ListField = 'colors' | 'stabilizers' | 'specs';

function parseBlock(block: string): Product | null {
	if (!block) return null;

	const fields: Record<string, string> = {};
	const lists: Record<string, string[]> = {};
	let currentList: ListField | null = null;

	const lines = block.split('\n');

	for (const line of lines) {
		// Skip comments and empty lines
		if (line.trimStart().startsWith('#') || line.trim() === '') {
			continue;
		}

		// List item (indented with -)
		if (/^\s+-\s/.test(line) && currentList) {
			lists[currentList] = lists[currentList] ?? [];
			lists[currentList].push(line.replace(/^\s+-\s*/, ''));
			continue;
		}

		// Key-value pair
		const match = line.match(/^([a-z-]+):\s*(.*)?$/);
		if (match) {
			const key = match[1];
			const value = (match[2] ?? '').trim();

			if (key === 'colors' || key === 'stabilizers' || key === 'specs') {
				currentList = key;
				lists[key] = [];
			} else {
				currentList = null;
				fields[key] = value;
			}
		}
	}

	if (!fields['name'] || !fields['slug']) return null;

	return {
		name: fields['name'],
		slug: fields['slug'],
		tagline: fields['tagline'] ?? '',
		description: fields['description'] ?? '',
		price: parseFloat(fields['price'] ?? '0'),
		placeholderColor: fields['placeholder-color'] ?? '#839496',
		imageCount: parseInt(fields['images'] ?? '0', 10) || 0,
		colors: (lists['colors'] ?? []).map(parseColor),
		stabilizers: (lists['stabilizers'] ?? []).map(parseStabilizer),
		wristRestPrice: parseFloat(fields['wrist-rest'] ?? '0'),
		specs: (lists['specs'] ?? []).map(parseSpec)
	};
}

function parseColor(raw: string): ColorOption {
	const parts = raw.split('|').map((s) => s.trim());
	return {
		name: parts[0],
		price: parts.length > 1 ? parseFloat(parts[1]) : 0
	};
}

function parseStabilizer(raw: string): StabilizerOption {
	const parts = raw.split('|').map((s) => s.trim());
	return {
		name: parts[0],
		price: parts.length > 1 ? parseFloat(parts[1]) : 0
	};
}

function parseSpec(raw: string): SpecItem {
	const parts = raw.split('|').map((s) => s.trim());
	return {
		label: parts[0],
		value: parts[1] ?? ''
	};
}
