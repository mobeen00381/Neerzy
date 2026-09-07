// Generic: render any Neerzy social graphic HTML to PNG.
// Usage: node social/scripts/render-post.mjs <htmlPath> <outPng> [width] [height]
import { chromium } from 'playwright';
import { existsSync } from 'fs';

const [, , htmlPath, outPng, wArg, hArg] = process.argv;
if (!htmlPath || !outPng) {
  console.error('usage: node render-post.mjs <htmlPath> <outPng> [width] [height]');
  process.exit(1);
}
if (!existsSync(htmlPath)) { console.error('html not found:', htmlPath); process.exit(1); }

const width = Number(wArg || 1080);
const height = Number(hArg || 1350);
const url = 'file:///' + htmlPath.replace(/\\/g, '/');

const browser = await chromium.launch({
  headless: true,
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none']
});
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1800); // webfonts settle
const box = await page.evaluate(() => {
  const el = document.getElementById('post') || document.body.firstElementChild;
  const r = el.getBoundingClientRect();
  return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
});
await page.locator('#post').screenshot({ path: outPng, type: 'png' });
console.log('SAVED', outPng, box.width + 'x' + box.height);
await browser.close();
