import { db } from './db.js';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CartItem } from '../store/types.js';
import type { Product } from '../store/types.js';
import { parseProducts } from '../store/parser.js';

// Load product catalog once at startup for server-side price validation
const catalogPath = resolve('static/products.txt');
const catalogText = readFileSync(catalogPath, 'utf-8');
const productCatalog: Map<string, Product> = new Map(
	parseProducts(catalogText).map((p) => [p.slug, p])
);

export interface OrderRow {
	id: string;
	status: string;
	total_cents: number;
	item_count: number;
	created_at: string;
}

export interface OrderDetail {
	id: string;
	status: string;
	total_cents: number;
	created_at: string;
	items: OrderItemRow[];
}

export interface OrderItemRow {
	id: string;
	product_slug: string;
	product_name: string;
	base_price_cents: number;
	color: string;
	color_surcharge_cents: number;
	stabilizer_name: string;
	stabilizer_price_cents: number;
	wrist_rest: number;
	wrist_rest_price_cents: number;
	quantity: number;
}

export class OrderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'OrderError';
	}
}

function toCents(dollars: number): number {
	return Math.round(dollars * 100);
}

export function createOrder(userId: string, items: CartItem[]): string {
	if (!items || items.length === 0) {
		throw new OrderError('Cart is empty');
	}
	if (items.length > 50) {
		throw new OrderError('Too many items');
	}

	for (const item of items) {
		if (!item.productSlug || !item.productName || !item.color) {
			throw new OrderError('Invalid item data');
		}
		if (item.quantity < 1 || item.quantity > 99) {
			throw new OrderError('Invalid quantity');
		}

		// Server-side price validation against product catalog
		const product = productCatalog.get(item.productSlug);
		if (!product) {
			throw new OrderError(`Unknown product: ${item.productSlug}`);
		}
		const catalogColor = product.colors.find((c) => c.name === item.color);
		if (!catalogColor) {
			throw new OrderError(`Invalid color for ${product.name}`);
		}
		if (toCents(item.colorPrice ?? 0) !== toCents(catalogColor.price)) {
			throw new OrderError(`Color price mismatch for ${product.name}`);
		}
		if (toCents(item.basePrice) !== toCents(product.price)) {
			throw new OrderError(`Price mismatch for ${product.name}`);
		}
		const catalogStab = product.stabilizers.find((s) => s.name === item.stabilizer.name);
		if (!catalogStab) {
			throw new OrderError(`Invalid stabilizer for ${product.name}`);
		}
		if (toCents(item.stabilizer.price) !== toCents(catalogStab.price)) {
			throw new OrderError(`Stabilizer price mismatch for ${product.name}`);
		}
		if (item.wristRest) {
			if (product.wristRestPrice <= 0) {
				throw new OrderError(`Wrist rest not available for ${product.name}`);
			}
			if (toCents(item.wristRestPrice) !== toCents(product.wristRestPrice)) {
				throw new OrderError(`Wrist rest price mismatch for ${product.name}`);
			}
		}
	}

	const orderId = randomUUID();

	let totalCents = 0;
	for (const item of items) {
		// Use catalog prices, not client-submitted prices
		const product = productCatalog.get(item.productSlug)!;
		const catalogColor = product.colors.find((c) => c.name === item.color)!;
		const catalogStab = product.stabilizers.find((s) => s.name === item.stabilizer.name)!;
		const unitCents =
			toCents(product.price) +
			toCents(catalogColor.price) +
			toCents(catalogStab.price) +
			(item.wristRest ? toCents(product.wristRestPrice) : 0);
		totalCents += unitCents * item.quantity;
	}

	const insertOrder = db.prepare(
		'INSERT INTO orders (id, user_id, total_cents) VALUES (?, ?, ?)'
	);
	const insertItem = db.prepare(
		`INSERT INTO order_items (id, order_id, product_slug, product_name, base_price_cents, color, color_surcharge_cents, stabilizer_name, stabilizer_price_cents, wrist_rest, wrist_rest_price_cents, quantity)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const run = db.transaction(() => {
		insertOrder.run(orderId, userId, totalCents);
		for (const item of items) {
			// Store catalog-verified prices, not client-submitted values
			const product = productCatalog.get(item.productSlug)!;
			const catalogColor = product.colors.find((c) => c.name === item.color)!;
			const catalogStab = product.stabilizers.find((s) => s.name === item.stabilizer.name)!;
			insertItem.run(
				randomUUID(),
				orderId,
				item.productSlug,
				product.name,
				toCents(product.price),
				item.color,
				toCents(catalogColor.price),
				catalogStab.name,
				toCents(catalogStab.price),
				item.wristRest ? 1 : 0,
				item.wristRest ? toCents(product.wristRestPrice) : 0,
				item.quantity
			);
		}
	});

	run();
	return orderId;
}

export function getOrders(userId: string): OrderRow[] {
	return db
		.prepare(
			`SELECT o.id, o.status, o.total_cents, o.created_at,
			        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
			 FROM orders o
			 WHERE o.user_id = ?
			 ORDER BY o.created_at DESC`
		)
		.all(userId) as OrderRow[];
}

export function setStripeSessionId(orderId: string, sessionId: string): void {
	db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(sessionId, orderId);
}

export function updateOrderPayment(orderId: string, status: string, paymentIntent: string): void {
	db.prepare('UPDATE orders SET status = ?, stripe_payment_intent = ? WHERE id = ?').run(
		status,
		paymentIntent,
		orderId
	);
}

export function getOrderById(orderId: string): (OrderDetail & { user_id: string }) | null {
	const order = db
		.prepare(
			`SELECT id, user_id, status, total_cents, created_at
			 FROM orders WHERE id = ?`
		)
		.get(orderId) as (Omit<OrderDetail, 'items'> & { user_id: string }) | undefined;

	if (!order) return null;

	const items = db
		.prepare(
			`SELECT id, product_slug, product_name, base_price_cents, color,
			        color_surcharge_cents, stabilizer_name, stabilizer_price_cents,
			        wrist_rest, wrist_rest_price_cents, quantity
			 FROM order_items WHERE order_id = ?
			 ORDER BY product_name`
		)
		.all(orderId) as OrderItemRow[];

	return { ...order, items };
}

export function getOrderByStripeSession(
	sessionId: string
): { id: string; user_id: string; status: string; total_cents: number } | null {
	return (
		(db
			.prepare('SELECT id, user_id, status, total_cents FROM orders WHERE stripe_session_id = ?')
			.get(sessionId) as
			| { id: string; user_id: string; status: string; total_cents: number }
			| undefined) ?? null
	);
}

export function cleanStalePendingOrders(): void {
	db.prepare(
		`DELETE FROM orders WHERE status = 'pending' AND created_at < datetime('now', '-24 hours')`
	).run();
}

export function getOrder(userId: string, orderId: string): OrderDetail | null {
	const order = db
		.prepare(
			`SELECT id, status, total_cents, created_at
			 FROM orders WHERE id = ? AND user_id = ?`
		)
		.get(orderId, userId) as Omit<OrderDetail, 'items'> | undefined;

	if (!order) return null;

	const items = db
		.prepare(
			`SELECT id, product_slug, product_name, base_price_cents, color,
			        color_surcharge_cents, stabilizer_name, stabilizer_price_cents,
			        wrist_rest, wrist_rest_price_cents, quantity
			 FROM order_items WHERE order_id = ?
			 ORDER BY product_name`
		)
		.all(orderId) as OrderItemRow[];

	return { ...order, items };
}
