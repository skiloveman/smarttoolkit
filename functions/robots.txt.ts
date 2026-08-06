export const onRequestGet = async () => {
  const body = [
    '# robots.txt for smart-toolkit',
    '# Allow Naver search crawler',
    'User-agent: Yeti',
    'Allow: /',
    '',
    '# Allow all other crawlers',
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: https://smart-toolkit.com/sitemap.xml',
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Keep robots fresh after deployments.
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
};
