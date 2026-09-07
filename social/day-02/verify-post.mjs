// Layout audit for day-02-post: element bounds within 1080x1350, no clipping.
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file:///C:/Neerzy/social/day-02/day-02-post.html', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const ids = ['img.logo', '.badge', 'h1', '.phone', '.chips', '.cta-pill', '.cta-note'];
  const r = {};
  for (const s of ids) {
    const el = document.querySelector(s);
    if (!el) { r[s] = 'MISSING'; continue; }
    const b = el.getBoundingClientRect();
    r[s] = { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) };
  }
  const bubbles = [...document.querySelectorAll('.bubble')].map((el, i) => {
    const b = el.getBoundingClientRect();
    return { i: i + 1, top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), txt: el.textContent.slice(0, 30) };
  });
  const last = Math.round(document.querySelector('.cta-note').getBoundingClientRect().bottom);
  return { r, bubbles, lastBottom: last, fits: last <= 1350 - 40, interLoaded: document.fonts.check('600 29px Inter') };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
