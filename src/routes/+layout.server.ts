import type { LayoutServerLoad } from './$types';
import { isAdmin } from '$lib/server/auth.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		isAdmin: locals.user ? isAdmin(locals.user.id) : false
	};
};
