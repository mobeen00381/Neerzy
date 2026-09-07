// Layout audit for day-04 post: element bounds within 1080x1350.
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file:///C:/Neerzy/social/day-04/day-04-post.html', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const sels = ['img.logo', '.pill', 'h1', 'svg.dial', '.under', '.chips', '.cta-pill', '.cta-note'];
  const r = {};
  for (const s of sels) {
    const el = document.querySelector(s);
    if (!el) { r[s] = 'MISSING'; continue; }
    const b = el.getBoundingClientRect();
    r[s] = { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) };
  }
  const h1Lines = Math.round(document.querySelector('h1').getBoundingClientRect().height / (56 * 1.14));
  const last = Math.round(document.querySelector('.cta-note').getBoundingClientRect().bottom);
  return { r, h1Lines, lastBottom: last, fits: last <= 1350, inter: document.fonts.check('600 31px Inter') };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
