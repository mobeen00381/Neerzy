// Layout audit for any Neerzy social graphic — catches text overflow, off-canvas
// elements and webfont fallback before a PNG is shipped.
// Usage: node social/scripts/verify-layout.mjs <htmlPath> [width] [height]
import { chromium } from 'playwright';

const [, , htmlPath, wArg, hArg] = process.argv;
if (!htmlPath) {
  console.error('usage: node verify-layout.mjs <htmlPath> [width] [height]');
  process.exit(1);
}

const width = Number(wArg || 1080);
const height = Number(hArg || 1350);
const url = 'file:///' + htmlPath.replace(/\\/g, '/');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const report = await page.evaluate(({ W, H }) => {
  const post = document.getElementById('post');
  if (!post) return { error: 'no #post element' };

  const SVG_TAGS = ['path', 'circle', 'ellipse', 'rect', 'polyline', 'line', 'g', 'defs', 'svg'];
  const VOID_TAGS = ['br', 'hr'];
  // Decorative layers are deliberately bled off-canvas behind overflow:hidden,
  // and spacers are intentionally zero-height flex fillers.
  const DECO = ['glow', 'ring', 'dot', 'spacer', 'deco', 'burst'];

  const problems = [];
  const walk = (el) => {
    for (const child of el.children) {
      const tag = child.tagName.toLowerCase();
      const cls = typeof child.className === 'string' ? child.className.trim().split(/\s+/) : [];
      if (SVG_TAGS.includes(tag) || VOID_TAGS.includes(tag) || cls.some((c) => DECO.includes(c))) continue;

      const b = child.getBoundingClientRect();
      const label = tag + (cls.length ? '.' + cls.join('.') : '');
      if (b.height === 0 || b.width === 0) { problems.push(`${label} — zero size`); }
      else if (b.bottom > H + 0.6) problems.push(`${label} — overflows bottom (bottom ${Math.round(b.bottom)} > ${H})`);
      else if (b.right > W + 0.6) problems.push(`${label} — overflows right (right ${Math.round(b.right)} > ${W})`);
      else if (b.left < -0.6) problems.push(`${label} — overflows left (left ${Math.round(b.left)})`);
      else if (b.top < -0.6) problems.push(`${label} — overflows top (top ${Math.round(b.top)})`);
      walk(child);
    }
  };
  walk(post);

  // Does the last visible content sit inside the canvas, with breathing room?
  const all = [...post.querySelectorAll('*')].filter((el) => {
    const t = el.tagName.toLowerCase();
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/) : [];
    return !SVG_TAGS.includes(t) && !VOID_TAGS.includes(t) && !cls.some((c) => DECO.includes(c));
  });
  const lastBottom = Math.round(Math.max(...all.map((el) => el.getBoundingClientRect().bottom)));

  // Clipped-content check: only boxes that actually hide their overflow can cut
  // off content, and only real (non-decorative) children count — decorative
  // layers are bled off-canvas on purpose behind overflow:hidden.
  const clipped = [];
  const isReal = (el) => {
    const t = el.tagName.toLowerCase();
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/) : [];
    return !VOID_TAGS.includes(t) && !cls.some((c) => DECO.includes(c));
  };
  for (const el of all) {
    const cs = getComputedStyle(el);
    const hides = ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowY) ||
                  ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX);
    if (!hides) continue;
    const box = el.getBoundingClientRect();
    for (const kid of el.querySelectorAll('*')) {
      if (!isReal(kid)) continue;
      const b = kid.getBoundingClientRect();
      const cls = typeof kid.className === 'string' ? kid.className.trim().split(/\s+/).join('.') : '';
      const name = `${kid.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
      if (b.bottom > box.bottom + 2) clipped.push(`${name} cut off bottom inside ${el.tagName.toLowerCase()}.${(el.className || '').trim().split(/\s+/).join('.')} (+${Math.round(b.bottom - box.bottom)}px)`);
      else if (b.right > box.right + 2) clipped.push(`${name} cut off right inside ${el.tagName.toLowerCase()}.${(el.className || '').trim().split(/\s+/).join('.')} (+${Math.round(b.right - box.right)}px)`);
    }
  }

  const body = post.getBoundingClientRect();
  // Palette proof: every post must combine light AND dark Neerzy surfaces
  // (the brief: no post may be a single dark colour again).
  const LIGHT = ['rgb(255, 255, 255)', 'rgb(230, 242, 234)', 'rgb(247, 249, 248)', 'rgb(220, 252, 231)', 'rgb(225, 232, 228)', 'rgb(211, 230, 218)'];
  const DARK = ['rgb(11, 61, 46)', 'rgb(15, 81, 50)', 'rgb(6, 37, 27)', 'rgb(20, 83, 45)', 'rgb(10, 46, 34)'];
  const ACCENT = ['rgb(34, 197, 94)', 'rgb(22, 163, 74)', 'rgb(74, 222, 128)'];
  const surfaces = { light: 0, dark: 0, accent: 0, other: [] };
  for (const el of all) {
    const bg = getComputedStyle(el).backgroundColor;
    if (LIGHT.includes(bg)) surfaces.light++;
    else if (DARK.includes(bg)) surfaces.dark++;
    else if (ACCENT.includes(bg)) surfaces.accent++;
    else if (bg !== 'rgba(0, 0, 0, 0)') {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).join('.') : '';
      surfaces.other.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} ${bg}`);
    }
  }
  const palette = {
    lightSurfaces: surfaces.light,
    darkSurfaces: surfaces.dark,
    accentSurfaces: surfaces.accent,
    offPalette: surfaces.other,
    mixed: surfaces.light > 0 && surfaces.dark > 0 && surfaces.other.length === 0,
  };

  const bands = [...post.children].map((el) => {
    const b = el.getBoundingClientRect();
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).join('.') : '';
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}: ${Math.round(b.top)}–${Math.round(b.bottom)} (h ${Math.round(b.height)})`;
  });

  // How much empty room is left inside the middle band (grown by a flex spacer)?
  const mid = [...post.children].find((el) => !el.classList.contains('top') && el.clientHeight > 200 && el.clientHeight < 1200);
  let bodySlack = null;
  if (mid) {
    const box = mid.getBoundingClientRect();
    const kids = [...mid.querySelectorAll('*')].filter((el) => {
      const t = el.tagName.toLowerCase();
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/) : [];
      return !SVG_TAGS.includes(t) && !VOID_TAGS.includes(t) && !cls.some((c) => DECO.includes(c));
    });
    const deepest = Math.max(...kids.map((el) => el.getBoundingClientRect().bottom));
    bodySlack = Math.round(box.bottom - deepest);
  }
  return {
    canvas: `${Math.round(body.width)}x${Math.round(body.height)}`,
    bands,
    bodySlack,
    palette,
    lastContentBottom: lastBottom,
    tailRoom: Math.round(H - lastBottom),
    fontLoaded: document.fonts.check('900 60px Inter'),
    problems,
    clipped,
    ok: problems.length === 0 && clipped.length === 0 && palette.mixed,
  };
}, { W: width, H: height });

console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.ok ? 0 : 1);
