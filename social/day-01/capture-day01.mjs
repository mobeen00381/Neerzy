// Render Day 1 launch graphic (1080x1350, 4:5) to PNG using headless Chromium.
import { chromium } from 'playwright';

const out = 'C:/Neerzy/social/day-01/day-01-launch.png';
const browser = await chromium.launch({
  headless: true,
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none']
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file:///C:/Neerzy/social/day-01/day-01-launch.html', { waitUntil: 'load' });
await page.waitForTimeout(1800); // let webfonts settle
await page.locator('#post').screenshot({ path: out, type: 'png' });
console.log('SAVED', out);
await browser.close();
