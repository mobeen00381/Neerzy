// Layout audit for day-07 post.
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file:///C:/Neerzy/social/day-07/day-07-post.html', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const sels = ['img.logo', '.pill', 'h1', 'svg.seal', '.pledge', '.divider', '.cta-pill', '.foot'];
  const r = {};
  for (const s of sels) {
    const el = document.querySelector(s);
    if (!el) { r[s] = 'MISSING'; continue; }
    const b = el.getBoundingClientRect();
    r[s] = { top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) };
  }
  const pls = [...document.querySelectorAll('.pl')].map((el) => Math.round(el.getBoundingClientRect().width));
  const last = Math.round(document.querySelector('.foot').getBoundingClientRect().bottom);
  return { r, plWidths: pls, lastBottom: last, fits: last <= 1350, inter: document.fonts.check('900 49px Inter') };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
