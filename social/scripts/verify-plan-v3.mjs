// =============================================================
// End-to-end verification for the v3 deliverables.
//   1. the xlsx (both copies) parses and every one of the 30 rows x 12
//      columns matches social/scripts/plan-v3-data.mjs cell for cell
//   2. each reel day has an ASCII-clean caption sheet containing the
//      hook, caption, hashtags, CTA and asset paths from the plan row
//   3. every reel MP4 exists, is 1080x1920 at 30fps, and its real
//      duration matches the storyboard scene sum in reel/reel-data.mjs
//   4. social/plan-v3.md exists, is ASCII-only, and links all 12 reels
// Usage: node social/scripts/verify-plan-v3.mjs
// Exits non-zero if any check group fails.
// =============================================================

import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import zlib from 'zlib';
import { PLAN } from './plan-v3-data.mjs';
import { REELS } from '../../reel/reel-data.mjs';

const ROOT = 'C:/Neerzy';
const XLSX = [
  'C:/Users/PC/Downloads/Neerzy_30_Day_FB_IG_Content_Plan_v3.xlsx',
  ROOT + '/social/Neerzy_30_Day_FB_IG_Content_Plan_v3.xlsx'
];
const HEADERS = [
  'Day', 'Date', 'Weekday', 'Platform', 'Format', 'Content Pillar',
  'Title / Hook (on-screen text)', 'Caption (simple, plain words)', 'Hashtags',
  'Call To Action', 'Visual / Filming Note', 'Best Time To Post'
];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const REEL_DAYS = PLAN.filter((r) => r.format === 'Reel').map((r) => r.day);

let failures = 0;
function fail(msg) {
  failures++;
  console.log('FAIL ' + msg);
}
function pass(msg) {
  console.log('ok   ' + msg);
}

// ---------------- 1. xlsx ----------------
// The xlsx is written by a dependency-free OOXML writer, so read it the
// same way: walk the local file headers and inflate the deflate streams.
function unzip(buf) {
  const files = new Map();
  let off = 0;
  while (off + 30 <= buf.length && buf.readUInt32LE(off) === 0x04034b50) {
    const method = buf.readUInt16LE(off + 8);
    const compSize = buf.readUInt32LE(off + 18);
    const nameLen = buf.readUInt16LE(off + 26);
    const extraLen = buf.readUInt16LE(off + 28);
    const name = buf.toString('utf8', off + 30, off + 30 + nameLen);
    const start = off + 30 + nameLen + extraLen;
    const raw = buf.subarray(start, start + compSize);
    files.set(name, (method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8'));
    off = start + compSize;
  }
  return files;
}

function unescapeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function readSheet(path) {
  const files = unzip(readFileSync(path));
  const xml = files.get('xl/worksheets/sheet1.xml');
  if (!xml) throw new Error('no xl/worksheets/sheet1.xml in ' + path);
  const grid = new Map();
  const rowRe = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml)) !== null) {
    const rowNum = Number(rm[1]);
    const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm;
    while ((cm = cellRe.exec(rm[2])) !== null) {
      const body = cm[3] || '';
      const t = /<t>([\s\S]*?)<\/t>/.exec(body);
      const v = /<v>([\s\S]*?)<\/v>/.exec(body);
      grid.set(cm[1] + rowNum, unescapeXml(t ? t[1] : v ? v[1] : ''));
    }
  }
  return grid;
}

function checkXlsx(path) {
  if (!existsSync(path)) return fail('xlsx missing: ' + path);
  const grid = readSheet(path);
  const wrongHeader = HEADERS.filter((h, i) => grid.get(LETTERS[i] + '1') !== h);
  if (wrongHeader.length) fail('header row mismatch in ' + path + ': ' + wrongHeader.join(', '));
  let diffs = 0;
  PLAN.forEach((r, idx) => {
    const n = idx + 2;
    const vals = [r.day, r.date, r.weekday, r.platform, r.format, r.pillar,
      r.hook, r.caption, r.tags, r.cta, r.visual, r.time];
    vals.forEach((v, i) => {
      const got = grid.get(LETTERS[i] + n);
      if (got !== String(v)) {
        diffs++;
        if (diffs <= 5) {
          fail(path + ' ' + LETTERS[i] + n + ' expected "' + String(v).slice(0, 40) +
            '" got "' + String(got).slice(0, 40) + '"');
        }
      }
    });
  });
  if (diffs) fail(path + ': ' + diffs + ' cell difference(s) vs plan data');
  else pass(path + ': 1 header row + 30 rows x 12 columns match plan data');
}


// ---------------- 2. caption sheets ----------------
function checkCaptions() {
  for (const day of REEL_DAYS) {
    const r = PLAN.find((x) => x.day === day);
    const nn = String(day).padStart(2, '0');
    const file = ROOT + '/social/day-' + nn + '/caption.txt';
    if (!existsSync(file)) {
      fail('caption sheet missing: ' + file);
      continue;
    }
    const txt = readFileSync(file, 'utf8');
    const required = [
      ['hook', r.hook], ['caption', r.caption], ['hashtags', r.tags], ['cta', r.cta],
      ['date', r.date], ['platform', r.platform], ['pillar', r.pillar], ['best time', r.time],
      ['mp4 path', 'social/day-' + nn + '/day-' + nn + '-reel.mp4'],
      ['storyboard', 'public/reel-day' + nn + '.html']
    ];
    const missing = required.filter((c) => !txt.includes(c[1])).map((c) => c[0]);
    if (missing.length) fail('day-' + nn + ' caption sheet missing: ' + missing.join(', '));
    const nonAscii = [...new Set(txt.split('').filter((c) => c.charCodeAt(0) > 126))];
    if (nonAscii.length) fail('day-' + nn + ' caption sheet has non-ASCII: ' + nonAscii.join(' '));
  }
  pass(REEL_DAYS.length + ' caption sheets complete, ASCII-clean and consistent with their plan row');
}

// ---------------- 3. rendered reels ----------------
function ffprobe(args) {
  return execFileSync('ffprobe', args, { encoding: 'utf8' }).trim();
}

function media(path) {
  const streams = ffprobe(['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', path]);
  const duration = ffprobe(['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', path]);
  const s = JSON.parse(streams).streams[0];
  return { width: s.width, height: s.height, fps: s.r_frame_rate, duration: Number(duration) };
}

function checkReels() {
  for (const day of REEL_DAYS) {
    const nn = String(day).padStart(2, '0');
    const mp4 = ROOT + '/social/day-' + nn + '/day-' + nn + '-reel.mp4';
    const page = ROOT + '/public/reel-day' + nn + '.html';
    if (!existsSync(mp4)) {
      fail('reel missing: ' + mp4);
      continue;
    }
    if (!existsSync(page)) fail('storyboard page missing: ' + page);
    const m = media(mp4);
    const expected = Math.round(REELS[day].scenes.reduce((n, s) => n + s.dur, 0) * 100) / 100;
    if (m.width !== 1080 || m.height !== 1920) {
      fail('day-' + nn + ' is ' + m.width + 'x' + m.height + ', expected 1080x1920');
    }
    if (m.fps !== '30/1') fail('day-' + nn + ' fps is ' + m.fps + ', expected 30/1');
    if (Math.abs(m.duration - expected) > 0.05) {
      fail('day-' + nn + ' duration ' + m.duration + 's, storyboard says ' + expected + 's');
    }
  }
  pass(REEL_DAYS.length + ' reels rendered, 1080x1920 at 30fps, durations match the storyboards');
}

// ---------------- 4. markdown plan ----------------
function checkMarkdown() {
  const md = ROOT + '/social/plan-v3.md';
  if (!existsSync(md)) return fail('missing ' + md);
  const txt = readFileSync(md, 'utf8');
  const nonAscii = [...new Set(txt.split('').filter((c) => c.charCodeAt(0) > 126))];
  if (nonAscii.length) fail('plan-v3.md has non-ASCII characters: ' + nonAscii.join(' '));
  let linked = 0;
  for (const day of REEL_DAYS) {
    const nn = String(day).padStart(2, '0');
    if (txt.includes('social/day-' + nn + '/day-' + nn + '-reel.mp4')) linked++;
    else fail('plan-v3.md does not link day-' + nn + ' reel');
  }
  for (const r of PLAN) {
    if (!txt.includes(r.caption)) fail('plan-v3.md is missing the day ' + r.day + ' caption');
  }
  pass('plan-v3.md: ASCII-clean, all 30 captions present, ' + linked + '/12 reel MP4 links');
}

// ---------------- run ----------------
console.log('verifying the Neerzy v3 content plan rollout');
for (const p of XLSX) checkXlsx(p);
checkCaptions();
checkReels();
checkMarkdown();
console.log(failures ? failures + ' check(s) FAILED' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
