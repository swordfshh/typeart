import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET_VALUE = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!STRIPE_SECRET_KEY) {
	console.warn('WARNING: STRIPE_SECRET_KEY is not set — checkout will fail');
}
if (!STRIPE_WEBHOOK_SECRET_VALUE) {
	console.warn('WARNING: STRIPE_WEBHOOK_SECRET is not set — webhooks will be rejected');
}

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

export const STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET_VALUE;
