import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALCULATOR_LIST, CALCULATOR_GUIDES } from '../src/data/calculatorInfo';

const SITE_URL = 'https://www.smart-toolkit.com';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(date: Date): string {
  return date.toUTCString().replace('GMT', '+0000');
}

const buildDate = toRfc822(new Date());

const items = CALCULATOR_LIST.map((calc) => {
  const guide = CALCULATOR_GUIDES[calc.id];
  if (!guide) return '';

  const link = `${SITE_URL}/#calc-${calc.id}`;

  return [
    '    <item>',
    `      <title>${escapeXml(guide.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="false">smart-toolkit-guide-${calc.id}</guid>`,
    `      <pubDate>${buildDate}</pubDate>`,
    `      <category>${escapeXml(calc.category)}</category>`,
    `      <description><![CDATA[${guide.summary}]]></description>`,
    '    </item>',
  ].join('\n');
}).filter(Boolean).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>스마트 툴킷 | 계산기 가이드</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>연봉, BMI, 퇴직금, 부가세, 전기요금, 환율 등 생활 계산기 사용 가이드 모음</description>
    <language>ko-kr</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

const outPath = path.resolve(__dirname, '../public/rss.xml');
writeFileSync(outPath, rss, 'utf-8');
console.log(`RSS feed generated: ${outPath} (${CALCULATOR_LIST.length} items)`);
