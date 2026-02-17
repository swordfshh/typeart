/**
 * Cart state store.
 * Manages shopping cart items with localStorage persistence.
 */

import type { CartItem, Product, VariantSelection } from '../store/types.js';

const STORAGE_KEY = 'typeart-cart';

class CartStore {
	items: CartItem[] = $state([]);

	get totalItems(): number {
		return this.items.reduce((sum, item) => sum + item.quantity, 0);
	}

	get totalPrice(): number {
		return this.items.reduce((sum, item) => {
			const unitPrice =
				item.basePrice + (item.colorPrice ?? 0) + item.stabilizer.price + (item.wristRest ? item.wristRestPrice : 0);
			return sum + unitPrice * item.quantity;
		}, 0);
	}

	addItem(product: Product, variants: VariantSelection): void {
		const id = buildId(product.slug, variants);

		const existing = this.items.find((item) => item.id === id);
		if (existing) {
			existing.quantity += 1;
		} else {
			this.items.push({
				id,
				productSlug: product.slug,
				productName: product.name,
				basePrice: product.price,
				color: variants.color.name,
				colorPrice: variants.color.price,
				stabilizer: variants.stabilizer,
				wristRest: variants.wristRest,
				wristRestPrice: product.wristRestPrice,
				quantity: 1
			});
		}

		this.persist();
	}

	updateQuantity(id: string, qty: number): void {
		if (qty <= 0) {
			this.removeItem(id);
			return;
		}
		const item = this.items.find((i) => i.id === id);
		if (item) {
			item.quantity = qty;
			this.persist();
		}
	}

	removeItem(id: string): void {
		this.items = this.items.filter((i) => i.id !== id);
		this.persist();
	}

	clear(): void {
		this.items = [];
		this.persist();
	}

	persist(): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
		} catch {
			// Storage full or unavailable — silently ignore
		}
	}

	hydrate(): void {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				this.items = JSON.parse(raw);
			}
		} catch {
			// Corrupt data — start fresh
			this.items = [];
		}
	}
}

function buildId(slug: string, v: VariantSelection): string {
	return `${slug}|${v.color.name}|${v.stabilizer.name}|${v.wristRest}`;
}

export const cartStore = new CartStore();
