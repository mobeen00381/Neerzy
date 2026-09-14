// Pixel audit of rendered Neerzy social PNGs.
// Confirms the export is 1080x1350 and that light AND dark brand surfaces are
// genuinely present in the pixels (the brief: no post may be one dark colour).
// Usage: node social/scripts/audit-png.mjs <pngPath> [morePngs...]
import sharp from 'sharp';
import { existsSync } from 'fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node audit-png.mjs <pngPath> [morePngs...]');
  process.exit(1);
}

const LIGHT_MIN = 200;
const DARK_MAX = 100;

for (const file of files) {
  if (!existsSync(file)) { console.log(`${file}: MISSING`); continue; }
  const img = sharp(file).removeAlpha();
  const { width, height } = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  let light = 0, dark = 0, mid = 0, green = 0;
  const total = info.width * info.height;
  for (let i = 0; i < total; i++) {
    const o = i * ch;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (g > r + 25 && g > b + 25) green++;              // accent / brand green pixels
    if (lum >= LIGHT_MIN) light++;
    else if (lum <= DARK_MAX) dark++;
    else mid++;
  }

  const pct = (n) => Math.round((n / total) * 1000) / 10;
  const ok = width === 1080 && height === 1350 && pct(light) >= 15 && pct(dark) >= 15;
  console.log(JSON.stringify({
    file,
    size: `${width}x${height}`,
    lightPct: pct(light),
    darkPct: pct(dark),
    midPct: pct(mid),
    brandGreenPct: pct(green),
    lightAndDarkMixed: ok,
  }));
}
