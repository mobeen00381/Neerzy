const baseUrl = 'http://localhost:3000';
const slugs = ['seo-for-plumbers', 'seo-for-electricians', 'reviews-score-guide'];

for (const slug of slugs) {
  const url = `${baseUrl}/${slug}`;
  const res = await fetch(url);
  const html = await res.text();
  const titleMatch = html.match(/<title>(.+?)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="(.+?)"/);
  console.log(`\
=== ${slug} ===
Status: ${res.status}
Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}
Description: ${descMatch ? descMatch[1] : 'NOT FOUND'}
Content length: ${html.length} chars
Canonical: ${(html.match(/<link rel="canonical" href="(.+?)"/) || [])[1] || 'NOT FOUND'}
`);
}