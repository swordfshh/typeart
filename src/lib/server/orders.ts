import { db } from './db.js';
import { randomUUID } from 'node:crypto';
import type { CartItem } from '../store/types.js';

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
		if (item.basePrice < 0) {
			throw new OrderError('Invalid price');
		}
	}

	const orderId = randomUUID();

	let totalCents = 0;
	for (const item of items) {
		const unitCents =
			toCents(item.basePrice) +
			toCents(item.stabilizer.price) +
			(item.wristRest ? toCents(item.wristRestPrice) : 0);
		totalCents += unitCents * item.quantity;
	}

	const insertOrder = db.prepare(
		'INSERT INTO orders (id, user_id, total_cents) VALUES (?, ?, ?)'
	);
	const insertItem = db.prepare(
		`INSERT INTO order_items (id, order_id, product_slug, product_name, base_price_cents, color, stabilizer_name, stabilizer_price_cents, wrist_rest, wrist_rest_price_cents, quantity)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const run = db.transaction(() => {
		insertOrder.run(orderId, userId, totalCents);
		for (const item of items) {
			insertItem.run(
				randomUUID(),
				orderId,
				item.productSlug,
				item.productName,
				toCents(item.basePrice),
				item.color,
				item.stabilizer.name,
				toCents(item.stabilizer.price),
				item.wristRest ? 1 : 0,
				item.wristRest ? toCents(item.wristRestPrice) : 0,
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
			        stabilizer_name, stabilizer_price_cents, wrist_rest,
			        wrist_rest_price_cents, quantity
			 FROM order_items WHERE order_id = ?
			 ORDER BY product_name`
		)
		.all(orderId) as OrderItemRow[];

	return { ...order, items };
}
