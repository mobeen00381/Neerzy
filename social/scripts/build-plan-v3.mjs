// =============================================================
// Builds the v3 deliverables from the single source of truth:
//   1. social/plan-v3.md                       (full human-readable plan)
//   2. social/day-NN/caption.txt               (for the 12 reel days)
//   3. Neerzy_30_Day_FB_IG_Content_Plan_v3.xlsx (12-column plan sheet)
// Usage: node social/scripts/build-plan-v3.mjs
// The xlsx is written from scratch with a tiny OOXML writer (no deps),
// matching the v2 sheet: same 12 columns, same column widths, frozen
// header row, bold header fill, wrapped body cells.
// =============================================================
import { writeFileSync, mkdirSync } from 'fs';
import zlib from 'zlib';
import { PLAN } from './plan-v3-data.mjs';
import { REELS } from '../../reel/reel-data.mjs';

const XLSX_OUT = [
  'C:/Users/PC/Downloads/Neerzy_30_Day_FB_IG_Content_Plan_v3.xlsx',
  'C:/Neerzy/social/Neerzy_30_Day_FB_IG_Content_Plan_v3.xlsx'
];

function xml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------- minimal zip writer ----------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function zip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const data = Buffer.from(f.data, 'utf8');
    const crc = crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, body);
    centrals.push(central, name);
    offset += local.length + name.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

// ---------------- xlsx parts ----------------
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0B3D2E"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="30-Day Plan v3" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const CORE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Neerzy 30-Day FB/IG Content Plan v3</dc:title>
<dc:creator>Neerzy</dc:creator>
<cp:lastModifiedBy>Neerzy</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-09-26T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-09-26T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;

const COLS = [5, 12, 11, 10, 20, 16, 30, 55, 40, 26, 45, 14];
const HEADERS = [
  'Day', 'Date', 'Weekday', 'Platform', 'Format', 'Content Pillar',
  'Title / Hook (on-screen text)', 'Caption (simple, plain words)', 'Hashtags',
  'Call To Action', 'Visual / Filming Note', 'Best Time To Post'
];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function cell(ref, value, style, isNumber) {
  if (isNumber) return '<c r="' + ref + '" s="' + style + '" t="n"><v>' + value + '</v></c>';
  return '<c r="' + ref + '" s="' + style + '" t="inlineStr"><is><t>' + xml(value) + '</t></is></c>';
}

function sheetXml() {
  const row1 = '<row r="1" ht="30" customHeight="1">' +
    HEADERS.map((h, i) => cell(LETTERS[i] + '1', h, 1, false)).join('') + '</row>';
  const rows = PLAN.map((r, idx) => {
    const n = idx + 2;
    const vals = [r.day, r.date, r.weekday, r.platform, r.format, r.pillar,
      r.hook, r.caption, r.tags, r.cta, r.visual, r.time];
    const cells = vals.map((v, i) => {
      const center = i <= 4 || i === 11;
      return cell(LETTERS[i] + n, v, center ? 3 : 2, i === 0);
    }).join('');
    return '<row r="' + n + '" ht="96" customHeight="1">' + cells + '</row>';
  }).join('');
  const cols = COLS.map((w, i) =>
    '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetPr><outlinePr summaryBelow="1" summaryRight="1"/><pageSetUpPr/></sheetPr>' +
    '<dimension ref="A1:L' + (PLAN.length + 1) + '"/>' +
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '<selection pane="bottomLeft" activeCell="A1" sqref="A1"/></sheetView></sheetViews>' +
    '<sheetFormatPr baseColWidth="8" defaultRowHeight="15"/>' +
    '<cols>' + cols + '</cols>' +
    '<sheetData>' + row1 + rows + '</sheetData>' +
    '</worksheet>';
}

function writeXlsx() {
  const buf = zip([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: ROOT_RELS },
    { name: 'docProps/core.xml', data: CORE },
    { name: 'xl/workbook.xml', data: WORKBOOK },
    { name: 'xl/_rels/workbook.xml.rels', data: WORKBOOK_RELS },
    { name: 'xl/styles.xml', data: STYLES },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXml() }
  ]);
  for (const p of XLSX_OUT) {
    mkdirSync(p.slice(0, p.lastIndexOf('/')), { recursive: true });
    writeFileSync(p, buf);
    console.log('wrote ' + p + ' (' + Math.round(buf.length / 1024) + ' KB, ' + PLAN.length + ' rows)');
  }
}

// ---------------- reel helpers ----------------
const reelDays = PLAN.filter((r) => r.format === 'Reel').map((r) => r.day);

// A chat reply may be authored as one string or as an array of lines.
function replyText(reply) {
  return Array.isArray(reply) ? reply.join(' ') : reply;
}

function reelInfo(day) {
  const spec = REELS[day];
  const duration = Math.round(spec.scenes.reduce((n, s) => n + s.dur, 0) * 100) / 100;
  const nn = String(day).padStart(2, '0');
  let acc = 0;
  const beats = spec.scenes.map((s) => {
    const from = acc;
    acc += s.dur;
    const at = from.toFixed(1) + '-' + acc.toFixed(1) + 's';
    let text = '';
    if (s.kind === 'hook') text = s.kicker + ' - "' + s.line1 + '" / "' + s.line2 + '"';
    else if (s.kind === 'chat') text = 'Chat screen: "' + s.userMsg + '" -> Neerzy: "' + replyText(s.reply) +
      '" | rows: ' + s.results.join(' / ');
    else if (s.kind === 'cards') text = '"' + s.title + '" - ' + s.items.join(' / ');
    else if (s.kind === 'split') text = '"' + s.title + '" - left (' + s.leftLabel + '): ' +
      s.leftItems.join(', ') + ' | right (' + s.rightLabel + '): ' + s.rightItems.join(', ');
    else if (s.kind === 'score') text = 'Score reveal ' + s.score + '/100 (' + s.label + ') - ' +
      s.bars.map((b) => b.label + ' ' + b.pct + '%').join(' / ');
    else if (s.kind === 'stat') text = '"' + s.big + '" / "' + s.small + '"';
    else if (s.kind === 'timer') text = 'Countdown 5:00 to 0:00 (' + s.label + ') - ' + s.lines.join(' / ');
    else text = 'Logo + CTA "' + s.cta + '" - ' + s.footer;
    return { at, text };
  });
  return {
    nn,
    duration,
    mp4: 'social/day-' + nn + '/day-' + nn + '-reel.mp4',
    page: 'public/reel-day' + nn + '.html',
    captionFile: 'social/day-' + nn + '/caption.txt',
    beats
  };
}

function writeCaption(day, row) {
  const info = reelInfo(day);
  const lines = [];
  lines.push('NEERZY - 30 DAY SOCIAL MEDIA PLAN (v3)');
  lines.push('Day ' + row.day + ' | ' + row.date + ' (' + row.weekday + ') | ' +
    row.platform + ' | Pillar: ' + row.pillar);
  lines.push('Best time to post: ' + row.time);
  lines.push('='.repeat(48));
  lines.push('');
  lines.push('HOOK (on-screen promise)');
  lines.push('-'.repeat(48));
  lines.push(row.hook);
  lines.push('');
  lines.push('ASSET');
  lines.push('-'.repeat(48));
  lines.push(info.mp4 + '  (1080x1920, 9:16, ' + info.duration + 's)');
  lines.push('Storyboard page: ' + info.page);
  lines.push('');
  lines.push('REEL BEATS (on-screen text)');
  lines.push('-'.repeat(48));
  for (const b of info.beats) lines.push(b.at.padEnd(12) + b.text);
  lines.push('');
  lines.push('-'.repeat(48));
  lines.push('CAPTION');
  lines.push('-'.repeat(48));
  lines.push(row.caption);
  lines.push('');
  lines.push('-'.repeat(48));
  lines.push('HASHTAGS');
  lines.push('-'.repeat(48));
  lines.push(row.tags);
  lines.push('');
  lines.push('-'.repeat(48));
  lines.push('CALL TO ACTION');
  lines.push('-'.repeat(48));
  lines.push(row.cta + ' (neerzy.com/pricing)');
  lines.push('');
  lines.push('-'.repeat(48));
  lines.push('POSTING CHECKLIST');
  lines.push('-'.repeat(48));
  lines.push('[ ] Upload day-' + info.nn + '-reel.mp4 to IG Reels (FB Reels optional)');
  lines.push('[ ] Cover frame: pick a frame from the middle scene for the grid preview');
  lines.push('[ ] Caption above into the post body, hashtags appended');
  lines.push('[ ] CTA in the first comment or at the bottom of the caption');
  lines.push('[ ] Best time: ' + row.time);
  lines.push('');
  mkdirSync('C:/Neerzy/social/day-' + info.nn, { recursive: true });
  writeFileSync('C:/Neerzy/social/day-' + info.nn + '/caption.txt', lines.join('\n'), 'utf8');
  return info;
}

// ---------------- markdown ----------------
function writeMarkdown() {
  const L = [];
  const written = [];
  L.push('# Neerzy - 30-Day FB + IG Content Plan (v3)');
  L.push('');
  L.push('**Window:** Sep 28 - Oct 27, 2026  |  **30 posts**  |  **12 reels**  |  **Channels:** Facebook + Instagram');
  L.push('');
  L.push('Machine-readable twin: `Neerzy_30_Day_FB_IG_Content_Plan_v3.xlsx` (same 12 columns as the v2 sheet).');
  L.push('Source of truth: `social/scripts/plan-v3-data.mjs` (rows) + `reel/reel-data.mjs` (reel storyboards).');
  L.push('Generated by: `node social/scripts/build-plan-v3.mjs`.');
  L.push('');
  L.push('## What changed in v3');
  L.push('');
  L.push('v3 keeps the proven v2 publishing shape (same cadence, same 12 reel days, same plain-language voice)');
  L.push('and refreshes the copy around the features that shipped since:');
  L.push('');
  L.push('- **Synced website builder** - the site preview builds itself from the live Google profile and stays in sync (Day 12, Day 27 reel).');
  L.push('- **Flat $19 domain with local TLDs** - one price, registered in the trader\'s name, first 90 days of hosting free (Day 12, Day 15, Day 27).');
  L.push('- **GBP audit sub-scores** - profile completeness, reviews, activity and photos, each scored out of 100 (Day 10, Day 16 reel, Day 22 reel).');
  L.push('- **Review asks by WhatsApp, SMS or link** - the trader picks the channel, the customer gets the easiest one (Day 4, Day 5 reel, Day 24, Day 28 reel).');
  L.push('- **No-WhatsApp onboarding** - email or Google sign-in, quick-post link, SMS or link review asks (Day 24, Day 26 reel).');
  L.push('- **Trade landing pages and free guides** - plumbers, electricians, roofers, locksmiths, HVAC, plus service-area businesses (Day 19).');
  L.push('');
  L.push('All 12 reels were regenerated from scratch for v3, so the finished MP4s match the v3 captions word for word.');
  L.push('');
  L.push('## Pricing language locked for v3');
  L.push('');
  L.push('| Item | Copy used in the plan |');
  L.push('| --- | --- |');
  L.push('| Free start | 30-day trial, 5 posts + 5 review requests, no card needed |');
  L.push('| Website | Build and preview free |');
  L.push('| Domain | $19 once, registered in the trader\'s name |');
  L.push('| Hosting | Free for the first 90 days, then $10 per month |');
  L.push('| Plans after the trial | Pro $39, Growth $79, Agency $199 per month |');
  L.push('');
  L.push('## The 30 days at a glance');
  L.push('');
  L.push('| Day | Date | Weekday | Platform | Format | Pillar | Hook | Best time |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of PLAN) {
    L.push('| ' + r.day + ' | ' + r.date + ' | ' + r.weekday + ' | ' + r.platform + ' | ' + r.format +
      ' | ' + r.pillar + ' | ' + r.hook + ' | ' + r.time + ' |');
  }
  L.push('');
  L.push('## Day by day');
  L.push('');

  for (const r of PLAN) {
    L.push('### Day ' + r.day + ' - ' + r.weekday + ' ' + r.date + ' - ' + r.platform + ' - ' + r.format);
    L.push('');
    L.push('**Pillar:** ' + r.pillar);
    L.push('');
    L.push('**Hook / on-screen text:** ' + r.hook);
    L.push('');
    L.push('**Caption:**');
    L.push('');
    L.push('> ' + r.caption);
    L.push('');
    L.push('**Hashtags:** `' + r.tags + '`');
    L.push('');
    L.push('**Call to action:** ' + r.cta);
    L.push('');
    L.push('**Visual / filming note:** ' + r.visual);
    L.push('');
    L.push('**Best time to post:** ' + r.time);
    if (r.format === 'Reel') {
      const info = writeCaption(r.day, r);
      written.push({ day: r.day, info });
      L.push('');
      L.push('**Reel assets:**');
      L.push('');
      L.push('- Finished video: `' + info.mp4 + '` - 1080x1920, 9:16, ' + info.duration + 's');
      L.push('- Storyboard page: [`' + info.page + '`](../' + info.page + ')');
      L.push('- Caption + beats: [`' + info.captionFile + '`](' + info.captionFile.replace('social/', '') + ')');
    }
    L.push('');
  }

  L.push('## Reel production');
  L.push('');
  L.push('All 12 reels share one deterministic pipeline, so any day can be rebuilt frame for frame:');
  L.push('');
  L.push('```bash');
  L.push('node reel/build-reels.mjs            # writes public/reel-dayNN.html for all 12 reels');
  L.push('node reel/build-reels.mjs 5 8        # ... or rebuild selected days only');
  L.push('node reel/make-reel.mjs 5 8          # render + encode social/day-NN/day-NN-reel.mp4');
  L.push('node reel/preview.mjs 5 2,7,15       # full-res PNG stills for a visual check');
  L.push('node social/scripts/verify-plan-v3.mjs  # re-check xlsx, caption sheets, MP4s and this file');
  L.push('```');
  L.push('');
  L.push('Each generated page exposes the contract the renderer relies on: a 1080x1920 canvas `#cv`,');
  L.push('`window.__reel.DURATION`, a deterministic `window.__frameAt(t)` and `window.__reelReady`.');
  L.push('Frames are captured at 30fps with Playwright (parallel workers) and encoded with ffmpeg to H.264 yuv420p,');
  L.push('matching the finished v2 masters.');
  L.push('');
  L.push('| Day | Date | Reel length | Finished MP4 | Storyboard page |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const r of PLAN) {
    if (r.format !== 'Reel') continue;
    const info = reelInfo(r.day);
    L.push('| ' + r.day + ' | ' + r.date + ' | ' + info.duration + 's | `' + info.mp4 + '` | `' + info.page + '` |');
  }
  L.push('');
  L.push('## Posting checklist (every post)');
  L.push('');
  L.push('1. Post at the listed best time for that day.');
  L.push('2. Copy the caption verbatim; keep the hashtags on one line at the bottom.');
  L.push('3. For reels: upload the MP4 to IG Reels (FB Reels optional) and pick a mid-reel cover frame.');
  L.push('4. Reply to every comment in the first hour, even with a one-liner.');
  L.push('5. Log the post in the tracker and reuse the same hook style the following week.');
  L.push('');
  writeFileSync('C:/Neerzy/social/plan-v3.md', L.join('\n'), 'utf8');
  console.log('wrote C:/Neerzy/social/plan-v3.md (' + L.length + ' lines, ' + PLAN.length + ' days)');
  return written;
}

// ---------------- main ----------------
writeXlsx();
const written = writeMarkdown();
console.log('captions written: ' + written.map((w) => 'day-' + w.info.nn).join(', '));
console.log('reel days in plan: ' + reelDays.join(', '));
