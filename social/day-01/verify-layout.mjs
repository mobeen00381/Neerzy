// Check that the Inter webfont loaded and sample key element regions exist.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file:///C:/Neerzy/social/day-01/day-01-launch.html', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const badge = document.querySelector('.live-badge');
  const h1 = document.querySelector('h1');
  const style = (el) => ({ fam: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight, size: getComputedStyle(el).fontSize });
  const h1Rect = h1.getBoundingClientRect();
  const badgeRect = badge.getBoundingClientRect();
  const steps = [...document.querySelectorAll('.step')].map(el => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width) };
  });
  const cta = document.querySelector('.cta-pill').getBoundingClientRect();
  const note = document.querySelector('.cta-note').getBoundingClientRect();
  return {
    interLoaded: document.fonts.check('900 78px Inter') && document.fonts.check('900 44px Inter'),
    interStatus: [...document.fonts].filter(f => f.family.includes('Inter')).map(f => f.status),
    h1: { fam: style(h1).fam, size: style(h1).size, rect: { top: Math.round(h1Rect.top), bottom: Math.round(h1Rect.bottom) }, lines: Math.round(h1Rect.height / (parseFloat(style(h1).size) * 1.12)) },
    badge: { fam: style(badge).fam, rect: { top: Math.round(badgeRect.top), bottom: Math.round(badgeRect.bottom) } },
    steps, stepsStart: Math.round(document.querySelector('.steps').getBoundingClientRect().top),
    cta: { top: Math.round(cta.top), bottom: Math.round(cta.bottom) },
    ctaNote: { top: Math.round(note.top), bottom: Math.round(note.bottom) },
    lastBottom: Math.round(document.querySelector('.inner').lastElementChild.getBoundingClientRect().bottom),
    postH: Math.round(document.querySelector('#post').getBoundingClientRect().height)
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
