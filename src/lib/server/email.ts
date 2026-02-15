const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = 'TypeArt <noreply@typeart.co>';
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
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #2A1E0E; background: #F2EAD8;">
	<h2 style="margin-bottom: 16px;">Reset your password</h2>
	<p style="margin-bottom: 24px; color: #4D3F2A;">
		Someone requested a password reset for your TypeArt account.
		Click the button below to set a new password. This link expires in 1 hour.
	</p>
	<a href="${resetUrl}"
	   style="display: inline-block; padding: 12px 24px; background: #009DDC; color: #fff; text-decoration: none; border-radius: 4px; font-weight: 600;">
		Reset Password
	</a>
	<p style="margin-top: 24px; font-size: 13px; color: #8A7A5F;">
		If you didn't request this, ignore this email. Your password will remain unchanged.
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

export async function sendOrderConfirmationEmail(
	email: string,
	orderId: string,
	items: OrderEmailItem[],
	totalCents: number
): Promise<boolean> {
	const itemRows = items
		.map(
			(item) => `
		<tr>
			<td style="padding: 8px 0; border-bottom: 1px solid #C4B396;">
				${item.productName}<br>
				<span style="font-size: 12px; color: #8A7A5F;">
					${item.color}${item.stabilizerName ? ' &middot; ' + item.stabilizerName : ''}${item.wristRest ? ' &middot; Wrist rest' : ''}
				</span>
			</td>
			<td style="padding: 8px 0; border-bottom: 1px solid #C4B396; text-align: center;">${item.quantity}</td>
			<td style="padding: 8px 0; border-bottom: 1px solid #C4B396; text-align: right;">$${(item.lineTotalCents / 100).toFixed(2)}</td>
		</tr>`
		)
		.join('');

	return sendEmail({
		to: email,
		subject: `TypeArt order confirmed — ${orderId.slice(0, 8)}`,
		html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #2A1E0E; background: #F2EAD8;">
	<h2 style="margin-bottom: 4px;">Order confirmed</h2>
	<p style="font-size: 13px; color: #8A7A5F; margin-bottom: 24px; font-family: 'Courier New', monospace;">${orderId.slice(0, 8)}</p>
	<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
		<thead>
			<tr style="border-bottom: 2px solid #C4B396;">
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
	<p style="margin-top: 24px; font-size: 13px; color: #8A7A5F;">
		Thank you for your order. We'll begin building your keyboard soon.
	</p>
</body>
</html>`
	});
}
