// Validate Day 1 PNG: dimensions + brand palette presence (design.md locked colors).
import sharp from 'sharp';

const file = 'C:/Neerzy/social/day-01/day-01-launch.png';
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
console.log('size:', info.width + 'x' + info.height);

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
const blueish = { n: 0 };
let sample = 0;
for (let i = 0; i < data.length; i += info.channels * 8) {
  sample++;
  const p = [data[i], data[i+1], data[i+2]];
  for (const k in palette) if (near(p, palette[k], 14)) counts[k]++;
  if (p[2] > p[0] + 30 && p[2] > p[1] + 10) blueish.n++; // any blue-dominant pixel?
}
const pct = k => (counts[k] / sample * 100).toFixed(1) + '%';
console.log('palette coverage:');
for (const k in counts) console.log('  ' + k.padEnd(18), pct(k));
console.log('blue-dominant pixels: ' + (blueish.n / sample * 100).toFixed(3) + '%  (must be ~0)');
