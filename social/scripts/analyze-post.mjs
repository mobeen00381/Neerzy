// Generic: brand-palette audit for a rendered post PNG (design.md locked colors).
// Usage: node social/scripts/analyze-post.mjs <pngPath>
import sharp from 'sharp';
import { existsSync } from 'fs';

const file = process.argv[2];
if (!file || !existsSync(file)) { console.error('usage: node analyze-post.mjs <pngPath>'); process.exit(1); }
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });

const palette = {
  'bg #0B3D2E': [11, 61, 46],
  'primary #0F5132': [15, 81, 50],
  'accent #22C55E': [34, 197, 94],
  'white': [255, 255, 255],
  'mint #E6F2EA': [230, 242, 234],
  'darkText #0A2E22': [10, 46, 34],
};
const near = (p, c, tol) => Math.abs(p[0]-c[0])<=tol && Math.abs(p[1]-c[1])<=tol && Math.abs(p[2]-c[2])<=tol;
const counts = Object.fromEntries(Object.keys(palette).map(k => [k, 0]));
let sample = 0, blue = 0;
for (let i = 0; i < data.length; i += info.channels * 8) {
  sample++;
  const p = [data[i], data[i+1], data[i+2]];
  for (const k in palette) if (near(p, palette[k], 14)) counts[k]++;
  if (p[2] > p[0] + 30 && p[2] > p[1] + 10) blue++;
}
console.log('size:', info.width + 'x' + info.height);
for (const k in counts) console.log('  ' + k.padEnd(18), (counts[k] / sample * 100).toFixed(1) + '%');
console.log('blue-dominant:', (blue / sample * 100).toFixed(3) + '% (emoji/LCD only)');
