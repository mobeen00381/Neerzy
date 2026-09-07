// Layout audit for day-06 post.
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file:///C:/Neerzy/social/day-06/day-06-post.html', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const sels = ['img.logo', '.pill', 'h1', '.opts', '.cta-pill', '.note', '.foot'];
  const r = {};
  for (const s of sels) {
    const el = document.querySelector(s);
    if (!el) { r[s] = 'MISSING'; continue; }
    const b = el.getBoundingClientRect();
    r[s] = { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) };
  }
  const opts = [...document.querySelectorAll('.opt')].map((el, i) => {
    const b = el.getBoundingClientRect();
    const t = el.querySelector('.title').getBoundingClientRect();
    return { i: i + 1, top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), titleLines: Math.round(t.height / (33 * 1.28)) };
  });
  const h1Lines = Math.round(document.querySelector('h1').getBoundingClientRect().height / (56 * 1.14));
  const last = Math.round(document.querySelector('.foot').getBoundingClientRect().bottom);
  return { r, opts, h1Lines, lastBottom: last, fits: last <= 1350, inter: document.fonts.check('800 33px Inter') };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
