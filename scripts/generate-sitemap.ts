import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALCULATOR_LIST } from '../src/data/calculatorInfo';

const SITE_URL = 'https://www.smart-toolkit.com';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const today = new Date().toISOString().slice(0, 10);

const pathForCalc = (id: string): string => (id === 'salary' ? '/' : `/${id}`);

const urls = [
  { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
  ...CALCULATOR_LIST.filter((calc) => calc.id !== 'salary').map((calc) => ({
    loc: `${SITE_URL}${pathForCalc(calc.id)}`,
    changefreq: 'weekly',
    priority: calc.popular ? '0.9' : '0.8',
  })),
];

const body = urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

const outPath = path.resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outPath, sitemap, 'utf-8');
console.log(`Sitemap generated: ${outPath} (${urls.length} urls)`);
