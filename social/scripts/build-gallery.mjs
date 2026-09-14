// Builds social/index.html — a local review gallery for every day in the plan.
// Reads each social/day-NN/caption.txt, links its assets, and fills
// social/scripts/gallery-template.html.
// Usage: node social/scripts/build-gallery.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const SOCIAL = 'C:/Neerzy/social';
const TEMPLATE = join(SOCIAL, 'scripts', 'gallery-template.html');

const days = readdirSync(SOCIAL).filter((n) => /^day-\d+$/.test(n)).sort();
const isSep = (l) => /^-{10,}$/.test(l.trim());
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Split a caption.txt into [{ heading, body }] blocks. */
function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    if (isSep(lines[i])) {
      const heading = (lines[i + 1] || '').trim();
      if (heading && !isSep(lines[i + 2] || '') && heading.length < 60) {
        current = { heading, body: [] };
        sections.push(current);
        i += 2;
      }
      continue;
    }
    if (current) current.body.push(lines[i]);
  }
  for (const s of sections) s.body = s.body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return sections;
}

const cards = [];
let assetCount = 0;

for (const day of days) {
  const capPath = join(SOCIAL, day, 'caption.txt');
  if (!existsSync(capPath)) continue;
  const raw = readFileSync(capPath, 'utf8');
  const head = raw.split(/\r?\n/);
  const meta = (head[1] || day).trim().replace(/^Day \d+ · /, '');
  const bestTime = (head[2] || '').trim();

  const assets = [...new Set([...raw.matchAll(/social\/day-\d+\/[A-Za-z0-9._-]+\.(?:png|mp4|html)/g)].map((m) => m[0]))]
    .map((p) => p.replace(/^social\//, ''))
    .filter((rel) => existsSync(join(SOCIAL, rel)));
  assetCount += assets.length;

  const img = (src) => `<a class="shot" href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${day}" loading="lazy" /><span class="shot-tag">${src.split('/').pop()}</span></a>`;
  const vid = (src) => `<div class="shot"><video src="${src}" controls preload="metadata"></video><span class="shot-tag">${src.split('/').pop()}</span></div>`;
  const media = assets.filter((a) => a.endsWith('.png')).map(img)
    .concat(assets.filter((a) => a.endsWith('.mp4')).map(vid)).join('\n');

  const body = parseSections(raw)
    .filter((s) => !/^ASSET/i.test(s.heading))
    .map((s) => `<div class="sec${/CHECKLIST/i.test(s.heading) ? ' list' : ''}">
      <div class="sec-h">${esc(s.heading)}</div>
      <pre class="sec-b">${esc(s.body)}</pre>
    </div>`).join('\n');

  const links = assets.filter((a) => a.endsWith('.html')).map((a) => `<a class="chip" href="${a}" target="_blank" rel="noopener">source HTML</a>`)
    .concat(`<a class="chip" href="${day}/caption.txt" target="_blank" rel="noopener">caption.txt</a>`).join('');

  cards.push(`<section class="day" id="${day}">
  <header class="day-h">
    <div class="day-n">${day.replace('day-', 'Day ')}</div>
    <div class="day-meta"><p>${esc(meta)}</p><p class="time">${esc(bestTime)}</p></div>
  </header>
  <div class="media">${media || '<p class="empty">No asset recorded for this day.</p>'}</div>
  <div class="links">${links}</div>
  <div class="body">${body}</div>
</section>`);
}

const nav = days.map((d) => `<a href="#${d}">${d.replace('day-', 'D')}</a>`).join('');
const html = readFileSync(TEMPLATE, 'utf8')
  .replace('<!--NAV-->', nav)
  .replace('<!--CARDS-->', cards.join('\n'))
  .replace('<!--COUNT-->', String(days.length));

writeFileSync(join(SOCIAL, 'index.html'), html, 'utf8');
console.log(`SAVED social/index.html — ${days.length} days, ${assetCount} assets linked`);
