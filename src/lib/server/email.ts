const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = 'TypeArt <hello@typeart.co>';
const BASE_URL = process.env.BASE_URL || 'https://typeart.co';

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

async function sendEmail(options: SendEmailOptions): Promise<boolean> {
	if (!RESEND_API_KEY) {
		console.warn('RESEND_API_KEY not set, skipping email send');
		return false;
	}

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: FROM_EMAIL,
				to: options.to,
				subject: options.subject,
				html: options.html
			})
		});

		if (!res.ok) {
			const err = await res.text();
			console.error('Resend API error:', res.status, err);
			return false;
		}
		return true;
	} catch (err) {
		console.error('Email send failed:', err);
		return false;
	}
}

// --- Password reset ---

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
	const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
	return sendEmail({
		to: email,
		subject: 'Reset your TypeArt password',
		html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #f5f3ff; background: #0f0e17;">
	<h2 style="margin-bottom: 16px;">Reset your password</h2>
	<p style="margin-bottom: 24px; color: #e0ddf0;">
		Someone requested a password reset for your TypeArt account.
		Click the button below to set a new password. This link expires in 1 hour.
	</p>
	<a href="${resetUrl}"
	   style="display: inline-block; padding: 12px 24px; background: #0AD2D3; color: #0f0e17; text-decoration: none; border-radius: 4px; font-weight: 600;">
		Reset Password
	</a>
	<p style="margin-top: 24px; font-size: 13px; color: #7a7590;">
		If you didn't request this, ignore this email. Your password will remain unchanged.
	</p>
</body>
</html>`
	});
}

// --- Email verification ---

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
	const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
	return sendEmail({
		to: email,
		subject: 'Verify your TypeArt email',
		html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #f5f3ff; background: #0f0e17;">
	<h2 style="margin-bottom: 16px;">Verify your email</h2>
	<p style="margin-bottom: 24px; color: #e0ddf0;">
		Thanks for creating a TypeArt account. Click the button below to verify your email address.
		This link expires in 24 hours.
	</p>
	<a href="${verifyUrl}"
	   style="display: inline-block; padding: 12px 24px; background: #0AD2D3; color: #0f0e17; text-decoration: none; border-radius: 4px; font-weight: 600;">
		Verify Email
	</a>
	<p style="margin-top: 24px; font-size: 13px; color: #7a7590;">
		If you didn't create this account, ignore this email.
	</p>
</body>
</html>`
	});
}

// --- Welcome email ---

export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
	return sendEmail({
		to: email,
		subject: 'Welcome to TypeArt',
		html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #f5f3ff; background: #0f0e17;">
	<h2 style="margin-bottom: 16px;">Welcome, ${username}!</h2>
	<p style="margin-bottom: 24px; color: #e0ddf0;">
		Your email is verified and your TypeArt account is ready to go.
		Browse our keyboard kits, configure your keymap, or test your typing speed.
	</p>
	<a href="${BASE_URL}/store"
	   style="display: inline-block; padding: 12px 24px; background: #0AD2D3; color: #0f0e17; text-decoration: none; border-radius: 4px; font-weight: 600;">
		Browse the Store
	</a>
	<p style="margin-top: 24px; font-size: 13px; color: #7a7590;">
		<a href="${BASE_URL}/configure" style="color: #0AD2D3;">Configure your keymap</a> · <a href="${BASE_URL}/type" style="color: #0AD2D3;">Typing test</a>
	</p>
</body>
</html>`
	});
}

// --- Shipping notification ---

const TRACKING_URLS: Record<string, (n: string) => string> = {
	USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
	UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
	FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`
};

export async function sendShippingNotificationEmail(
	email: string,
	orderId: string,
	trackingNumber: string,
	carrier: string
): Promise<boolean> {
	const trackingUrl = TRACKING_URLS[carrier]?.(trackingNumber);
	const trackingLink = trackingUrl
		? `<a href="${trackingUrl}" style="color: #0AD2D3; text-decoration: underline;">${trackingNumber}</a>`
		: `<span style="font-family: 'Courier New', monospace;">${trackingNumber}</span>`;

	return sendEmail({
		to: email,
		subject: `Your TypeArt order has shipped — ${orderId.slice(0, 8)}`,
		html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #f5f3ff; background: #0f0e17;">
	<h2 style="margin-bottom: 4px;">Your order has shipped!</h2>
	<p style="font-size: 13px; color: #7a7590; margin-bottom: 24px; font-family: 'Courier New', monospace;">Order ${orderId.slice(0, 8)}</p>
	<div style="padding: 16px; background: #1a1928; border-radius: 4px; margin-bottom: 24px;">
		<p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Tracking</p>
		<p style="margin: 0; font-size: 14px; color: #e0ddf0;">
			${carrier}: ${trackingLink}
		</p>
	</div>
	<p style="font-size: 14px; color: #e0ddf0; margin-bottom: 24px;">
		Your keyboard is on its way. You can track your package using the link above.
	</p>
	<a href="${BASE_URL}/orders/${orderId}"
	   style="display: inline-block; padding: 12px 24px; background: #0AD2D3; color: #0f0e17; text-decoration: none; border-radius: 4px; font-weight: 600;">
		View Order
	</a>
	<p style="margin-top: 24px; font-size: 13px; color: #7a7590;">
		Thank you for choosing TypeArt.
	</p>
</body>
</html>`
	});
}

// --- Order confirmation ---

export interface OrderEmailItem {
	productName: string;
	color: string;
	stabilizerName: string;
	wristRest: boolean;
	quantity: number;
	lineTotalCents: number;
}

export interface ShippingEmailAddress {
	name: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
}

export async function sendOrderConfirmationEmail(
	email: string,
	orderId: string,
	items: OrderEmailItem[],
	totalCents: number,
	shipping?: ShippingEmailAddress | null
): Promise<boolean> {
	const itemRows = items
		.map(
			(item) => `
		<tr>
			<td style="padding: 8px 0; border-bottom: 1px solid #2e2b3f;">
				${item.productName}<br>
				<span style="font-size: 12px; color: #7a7590;">
					${item.color}${item.stabilizerName ? ' &middot; ' + item.stabilizerName : ''}${item.wristRest ? ' &middot; Wrist rest' : ''}
				</span>
			</td>
			<td style="padding: 8px 0; border-bottom: 1px solid #2e2b3f; text-align: center;">${item.quantity}</td>
			<td style="padding: 8px 0; border-bottom: 1px solid #2e2b3f; text-align: right;">$${(item.lineTotalCents / 100).toFixed(2)}</td>
		</tr>`
		)
		.join('');

	return sendEmail({
		to: email,
		subject: `TypeArt order confirmed — ${orderId.slice(0, 8)}`,
		html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #f5f3ff; background: #0f0e17;">
	<h2 style="margin-bottom: 4px;">Order confirmed</h2>
	<p style="font-size: 13px; color: #7a7590; margin-bottom: 24px; font-family: 'Courier New', monospace;">${orderId.slice(0, 8)}</p>
	<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
		<thead>
			<tr style="border-bottom: 2px solid #2e2b3f;">
				<th style="text-align: left; padding-bottom: 8px;">Item</th>
				<th style="text-align: center; padding-bottom: 8px;">Qty</th>
				<th style="text-align: right; padding-bottom: 8px;">Price</th>
			</tr>
		</thead>
		<tbody>${itemRows}</tbody>
	</table>
	<p style="margin-top: 16px; font-size: 18px; font-weight: 700; text-align: right;">
		Total: $${(totalCents / 100).toFixed(2)}
	</p>
	${shipping ? `
	<div style="margin-top: 24px; padding: 16px; background: #1a1928; border-radius: 4px;">
		<p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Ship to</p>
		<p style="margin: 0; font-size: 14px; color: #e0ddf0; line-height: 1.5;">
			${shipping.name}<br>
			${shipping.line1}${shipping.line2 ? '<br>' + shipping.line2 : ''}<br>
			${shipping.city}, ${shipping.state} ${shipping.postalCode}
		</p>
	</div>` : ''}
	<p style="margin-top: 24px; font-size: 13px; color: #7a7590;">
		Thank you for your order. We'll begin building your keyboard soon.
	</p>
</body>
</html>`
	});
}
