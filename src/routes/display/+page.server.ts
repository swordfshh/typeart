import { db } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stats = db
		.prepare(
			`SELECT
			(SELECT COUNT(*) FROM users) as total_users,
			(SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-1 day')) as users_today,
			(SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) as users_week,
			(SELECT COUNT(*) FROM orders) as total_orders,
			(SELECT COALESCE(SUM(total_cents), 0) FROM orders) as total_revenue_cents,
			(SELECT COUNT(*) FROM orders WHERE created_at >= datetime('now', '-1 day')) as orders_today,
			(SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE created_at >= datetime('now', '-1 day')) as revenue_today_cents,
			(SELECT COUNT(*) FROM orders WHERE created_at >= datetime('now', '-7 days')) as orders_week,
			(SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE created_at >= datetime('now', '-7 days')) as revenue_week_cents,
			(SELECT COUNT(*) FROM orders WHERE created_at >= datetime('now', '-30 days')) as orders_month,
			(SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE created_at >= datetime('now', '-30 days')) as revenue_month_cents,
			(SELECT COUNT(*) FROM typing_scores) as total_tests,
			(SELECT COUNT(*) FROM typing_scores WHERE created_at >= datetime('now', '-1 day')) as tests_today,
			(SELECT CAST(COALESCE(AVG(wpm), 0) AS INTEGER) FROM typing_scores) as avg_wpm,
			(SELECT COALESCE(MAX(wpm), 0) FROM typing_scores) as top_wpm`
		)
		.get() as {
		total_users: number;
		users_today: number;
		users_week: number;
		total_orders: number;
		total_revenue_cents: number;
		orders_today: number;
		revenue_today_cents: number;
		orders_week: number;
		revenue_week_cents: number;
		orders_month: number;
		revenue_month_cents: number;
		total_tests: number;
		tests_today: number;
		avg_wpm: number;
		top_wpm: number;
	};

	const recentOrders = db
		.prepare(
			`SELECT o.id, o.status, o.total_cents, o.created_at,
			        GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') as items_summary
			 FROM orders o
			 LEFT JOIN order_items oi ON oi.order_id = o.id
			 GROUP BY o.id
			 ORDER BY o.created_at DESC
			 LIMIT 6`
		)
		.all() as {
		id: string;
		status: string;
		total_cents: number;
		created_at: string;
		items_summary: string | null;
	}[];

	const popularProducts = db
		.prepare(
			`SELECT oi.product_name, SUM(oi.quantity) as total_qty,
			        COUNT(DISTINCT oi.order_id) as order_count
			 FROM order_items oi
			 GROUP BY oi.product_name
			 ORDER BY total_qty DESC
			 LIMIT 5`
		)
		.all() as {
		product_name: string;
		total_qty: number;
		order_count: number;
	}[];

	return { stats, recentOrders, popularProducts };
};
