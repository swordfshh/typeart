import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
	if (!_stripe) {
		if (!STRIPE_SECRET_KEY) {
			throw new Error('STRIPE_SECRET_KEY not set');
		}
		_stripe = new Stripe(STRIPE_SECRET_KEY);
	}
	return _stripe;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
