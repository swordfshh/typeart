import { parseProducts } from '$lib/store/parser.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SITE = 'https://typeart.co';

export const prerender = true;

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function GET() {
	const text = readFileSync(join('static', 'products.txt'), 'utf-8');
	const products = parseProducts(text);

	const items = products
		.map((p) => {
			const additionalImages = Array.from({ length: p.imageCount - 1 }, (_, i) =>
				`      <g:additional_image_link>${SITE}/images/products/${p.slug}/${i + 2}.jpg</g:additional_image_link>`
			).join('\n');

			return `    <item>
      <g:id>${p.slug}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:link>${SITE}/store/${p.slug}</g:link>
      <g:image_link>${SITE}/images/products/${p.slug}/1.jpg</g:image_link>
${additionalImages}
      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:brand>TypeArt</g:brand>
      <g:mpn>${p.slug}</g:mpn>
      <g:condition>new</g:condition>
      <g:google_product_category>303</g:google_product_category>
      <g:product_type>Mechanical Keyboards &gt; Keyboard Kits</g:product_type>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>0 USD</g:price>
      </g:shipping>
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TypeArt</title>
    <link>${SITE}</link>
    <description>Mechanical keyboard kits by TypeArt</description>
${items}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=UTF-8',
			'Cache-Control': 'max-age=3600'
		}
	});
}
