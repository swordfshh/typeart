import { parseProducts } from '$lib/store/parser.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SITE = 'https://typeart.co';

export const prerender = true;

export function GET() {
	const text = readFileSync(join('static', 'products.txt'), 'utf-8');
	const products = parseProducts(text);

	const staticPages = [
		{ loc: '', priority: '1.0' },
		{ loc: '/store', priority: '0.9' },
		{ loc: '/configure', priority: '0.7' },
		{ loc: '/type', priority: '0.7' },
		{ loc: '/test', priority: '0.6' },
		{ loc: '/about', priority: '0.5' }
	];

	const urls = staticPages
		.map(
			(p) => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <priority>${p.priority}</priority>
  </url>`
		)
		.concat(
			products.map(
				(p) => `  <url>
    <loc>${SITE}/store/${p.slug}</loc>
    <priority>0.8</priority>${Array.from({ length: p.imageCount }, (_, i) => `
    <image:image>
      <image:loc>${SITE}/images/products/${p.slug}/${i + 1}.jpg</image:loc>
    </image:image>`).join('')}
  </url>`
			)
		);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
