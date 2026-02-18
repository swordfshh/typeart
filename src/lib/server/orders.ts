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

export interface ShippingAddress {
	name: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
}

export interface OrderDetail {
	id: string;
	status: string;
	total_cents: number;
	created_at: string;
	tracking_number: string | null;
	tracking_carrier: string | null;
	confirmed_at: string | null;
	shipped_at: string | null;
	delivered_at: string | null;
	shipping: ShippingAddress | null;
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

export function getStock(slug: string): number {
	const row = db.prepare('SELECT quantity FROM product_inventory WHERE product_slug = ?').get(slug) as { quantity: number } | undefined;
	return row?.quantity ?? 0;
}

export function getStockAll(): Record<string, number> {
	const rows = db.prepare('SELECT product_slug, quantity FROM product_inventory').all() as { product_slug: string; quantity: number }[];
	const result: Record<string, number> = {};
	for (const row of rows) {
		result[row.product_slug] = row.quantity;
	}
	return result;
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

	// Aggregate requested quantities per product slug
	const qtyBySlug = new Map<string, number>();
	for (const item of items) {
		qtyBySlug.set(item.productSlug, (qtyBySlug.get(item.productSlug) ?? 0) + item.quantity);
	}

	const insertOrder = db.prepare(
		'INSERT INTO orders (id, user_id, total_cents) VALUES (?, ?, ?)'
	);
	const insertItem = db.prepare(
		`INSERT INTO order_items (id, order_id, product_slug, product_name, base_price_cents, color, color_surcharge_cents, stabilizer_name, stabilizer_price_cents, wrist_rest, wrist_rest_price_cents, quantity)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const checkStock = db.prepare('SELECT quantity FROM product_inventory WHERE product_slug = ?');
	const decrementStock = db.prepare(
		'UPDATE product_inventory SET quantity = quantity - ? WHERE product_slug = ?'
	);

	const run = db.transaction(() => {
		// Check and decrement stock atomically
		for (const [slug, qty] of qtyBySlug) {
			const row = checkStock.get(slug) as { quantity: number } | undefined;
			const available = row?.quantity ?? 0;
			if (available < qty) {
				const product = productCatalog.get(slug);
				const name = product?.name ?? slug;
				throw new OrderError(
					available === 0
						? `${name} is out of stock`
						: `Only ${available} ${name} available`
				);
			}
			decrementStock.run(qty, slug);
		}

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

/**
 * Check if a webhook event has already been processed (idempotency).
 * Returns true if the event was already handled.
 */
export function isWebhookEventProcessed(eventId: string): boolean {
	const row = db.prepare('SELECT 1 FROM webhook_events WHERE event_id = ?').get(eventId);
	return !!row;
}

/**
 * Atomically mark an order as paid and record the webhook event.
 * Prevents duplicate processing from concurrent webhook deliveries.
 */
export function processPaymentWebhook(
	eventId: string,
	eventType: string,
	orderId: string,
	paymentIntent: string
): boolean {
	const run = db.transaction(() => {
		// Double-check inside transaction to prevent race condition
		const existing = db.prepare('SELECT 1 FROM webhook_events WHERE event_id = ?').get(eventId);
		if (existing) return false;

		db.prepare(
			'INSERT INTO webhook_events (event_id, event_type, order_id) VALUES (?, ?, ?)'
		).run(eventId, eventType, orderId);

		db.prepare('UPDATE orders SET status = ?, stripe_payment_intent = ? WHERE id = ?').run(
			'paid',
			paymentIntent,
			orderId
		);

		return true;
	});
	return run();
}

/**
 * Record a webhook event without modifying order status (for non-payment events).
 */
export function recordWebhookEvent(eventId: string, eventType: string, orderId?: string): void {
	db.prepare(
		'INSERT OR IGNORE INTO webhook_events (event_id, event_type, order_id) VALUES (?, ?, ?)'
	).run(eventId, eventType, orderId ?? null);
}

interface OrderDbRow {
	id: string;
	status: string;
	total_cents: number;
	created_at: string;
	user_id?: string;
	tracking_number: string | null;
	tracking_carrier: string | null;
	confirmed_at: string | null;
	shipped_at: string | null;
	delivered_at: string | null;
	shipping_name: string | null;
	shipping_address_line1: string | null;
	shipping_address_line2: string | null;
	shipping_city: string | null;
	shipping_state: string | null;
	shipping_postal_code: string | null;
	shipping_country: string | null;
}

function buildShipping(row: OrderDbRow): ShippingAddress | null {
	if (!row.shipping_name || !row.shipping_address_line1) return null;
	return {
		name: row.shipping_name,
		line1: row.shipping_address_line1,
		line2: row.shipping_address_line2,
		city: row.shipping_city!,
		state: row.shipping_state!,
		postalCode: row.shipping_postal_code!,
		country: row.shipping_country!
	};
}

export function updateOrderShipping(orderId: string, shipping: ShippingAddress): void {
	db.prepare(
		`UPDATE orders SET
			shipping_name = ?, shipping_address_line1 = ?, shipping_address_line2 = ?,
			shipping_city = ?, shipping_state = ?, shipping_postal_code = ?, shipping_country = ?
		 WHERE id = ?`
	).run(
		shipping.name, shipping.line1, shipping.line2,
		shipping.city, shipping.state, shipping.postalCode, shipping.country,
		orderId
	);
}

export function getOrderById(orderId: string): (OrderDetail & { user_id: string }) | null {
	const row = db
		.prepare(
			`SELECT id, user_id, status, total_cents, created_at,
			        tracking_number, tracking_carrier, confirmed_at, shipped_at, delivered_at,
			        shipping_name, shipping_address_line1, shipping_address_line2,
			        shipping_city, shipping_state, shipping_postal_code, shipping_country
			 FROM orders WHERE id = ?`
		)
		.get(orderId) as (OrderDbRow & { user_id: string }) | undefined;

	if (!row) return null;

	const items = db
		.prepare(
			`SELECT id, product_slug, product_name, base_price_cents, color,
			        color_surcharge_cents, stabilizer_name, stabilizer_price_cents,
			        wrist_rest, wrist_rest_price_cents, quantity
			 FROM order_items WHERE order_id = ?
			 ORDER BY product_name`
		)
		.all(orderId) as OrderItemRow[];

	return {
		id: row.id, user_id: row.user_id, status: row.status,
		total_cents: row.total_cents, created_at: row.created_at,
		tracking_number: row.tracking_number, tracking_carrier: row.tracking_carrier,
		confirmed_at: row.confirmed_at, shipped_at: row.shipped_at, delivered_at: row.delivered_at,
		shipping: buildShipping(row), items
	};
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
	const deleted = db.prepare(
		`DELETE FROM orders WHERE status = 'pending' AND created_at < datetime('now', '-24 hours')`
	).run();
	if (deleted.changes > 0) {
		console.log(`Cleaned ${deleted.changes} stale pending order(s)`);
	}
}

export function cleanStaleWebhookEvents(): void {
	db.prepare(
		`DELETE FROM webhook_events WHERE processed_at < datetime('now', '-7 days')`
	).run();
}

export function getOrder(userId: string, orderId: string): OrderDetail | null {
	const row = db
		.prepare(
			`SELECT id, status, total_cents, created_at,
			        tracking_number, tracking_carrier, confirmed_at, shipped_at, delivered_at,
			        shipping_name, shipping_address_line1, shipping_address_line2,
			        shipping_city, shipping_state, shipping_postal_code, shipping_country
			 FROM orders WHERE id = ? AND user_id = ?`
		)
		.get(orderId, userId) as OrderDbRow | undefined;

	if (!row) return null;

	const items = db
		.prepare(
			`SELECT id, product_slug, product_name, base_price_cents, color,
			        color_surcharge_cents, stabilizer_name, stabilizer_price_cents,
			        wrist_rest, wrist_rest_price_cents, quantity
			 FROM order_items WHERE order_id = ?
			 ORDER BY product_name`
		)
		.all(orderId) as OrderItemRow[];

	return {
		id: row.id, status: row.status, total_cents: row.total_cents,
		created_at: row.created_at,
		tracking_number: row.tracking_number, tracking_carrier: row.tracking_carrier,
		confirmed_at: row.confirmed_at, shipped_at: row.shipped_at, delivered_at: row.delivered_at,
		shipping: buildShipping(row), items
	};
}

// --- Admin order management ---

export interface AdminOrderRow {
	id: string;
	status: string;
	total_cents: number;
	item_count: number;
	created_at: string;
	username: string;
	email: string;
	shipping_name: string | null;
	shipping_city: string | null;
	shipping_state: string | null;
}

const VALID_STATUSES = ['paid', 'confirmed', 'shipped', 'delivered'] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

const STATUS_ORDER: Record<string, number> = {
	paid: 0,
	confirmed: 1,
	shipped: 2,
	delivered: 3
};

export function getAllOrders(statusFilter?: string): AdminOrderRow[] {
	const params: string[] = [];
	let where = "WHERE o.status != 'pending'";
	if (statusFilter && VALID_STATUSES.includes(statusFilter as OrderStatus)) {
		where = 'WHERE o.status = ?';
		params.push(statusFilter);
	}

	return db
		.prepare(
			`SELECT o.id, o.status, o.total_cents, o.created_at,
			        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
			        u.username, u.email,
			        o.shipping_name, o.shipping_city, o.shipping_state
			 FROM orders o
			 JOIN users u ON o.user_id = u.id
			 ${where}
			 ORDER BY o.created_at DESC`
		)
		.all(...params) as AdminOrderRow[];
}

export function updateOrderStatus(
	orderId: string,
	newStatus: string
): { success: boolean; error?: string } {
	if (!VALID_STATUSES.includes(newStatus as OrderStatus)) {
		return { success: false, error: 'Invalid status' };
	}

	const row = db
		.prepare('SELECT status FROM orders WHERE id = ?')
		.get(orderId) as { status: string } | undefined;

	if (!row) {
		return { success: false, error: 'Order not found' };
	}

	const currentIdx = STATUS_ORDER[row.status];
	const newIdx = STATUS_ORDER[newStatus];

	if (currentIdx === undefined || newIdx === undefined || newIdx !== currentIdx + 1) {
		return { success: false, error: `Cannot transition from ${row.status} to ${newStatus}` };
	}

	const timestampCol =
		newStatus === 'confirmed'
			? 'confirmed_at'
			: newStatus === 'shipped'
				? 'shipped_at'
				: 'delivered_at';

	db.prepare(`UPDATE orders SET status = ?, ${timestampCol} = datetime('now') WHERE id = ?`).run(
		newStatus,
		orderId
	);

	return { success: true };
}

export function setTracking(
	orderId: string,
	trackingNumber: string,
	carrier: string
): void {
	db.prepare('UPDATE orders SET tracking_number = ?, tracking_carrier = ? WHERE id = ?').run(
		trackingNumber,
		carrier,
		orderId
	);
}

export function getOrderEmail(orderId: string): string | null {
	const row = db
		.prepare(
			`SELECT u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`
		)
		.get(orderId) as { email: string } | undefined;
	return row?.email ?? null;
}
