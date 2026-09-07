// Render each Day-3 carousel slide (1080x1350) to PNG and report layout bounds.
import { chromium } from 'playwright';

const outPre = 'C:/Neerzy/social/day-03/day-03-slide-';
const browser = await chromium.launch({
  headless: true,
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none']
});
const page = await browser.newPage({ viewport: { width: 1100, height: 2000 }, deviceScaleFactor: 1 });
await page.goto('file:///C:/Neerzy/social/day-03/day-03-carousel.html', { waitUntil: 'load' });
await page.waitForTimeout(1800);

const report = [];
for (let n = 1; n <= 4; n++) {
  const slide = page.locator(`#slide-${n}`);
  await slide.screenshot({ path: outPre + n + '.png', type: 'png' });
  const info = await slide.evaluate((el) => {
    const rect = (sel) => {
      const e = el.querySelector(sel);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { top: Math.round(b.top - el.getBoundingClientRect().top), bottom: Math.round(b.bottom - el.getBoundingClientRect().top), h: Math.round(b.height) };
    };
    return {
      pill: rect('.pill'), stepTag: rect('.stepTag'), icon: rect('.icon'),
      h2: rect('h2'), desc: rect('.desc'), cta: rect('.cta'),
      dots: rect('.dots'), foot: rect('.foot'), midH: Math.round(el.querySelector('.mid').getBoundingClientRect().height)
    };
  });
  report.push({ slide: n, ...info });
}
console.log(JSON.stringify(report, null, 1));
await browser.close();
