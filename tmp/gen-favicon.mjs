import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const svg = readFileSync('src/app/icon.svg');

await sharp(Buffer.from(svg), { density: 384 })
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('src/app/icon.png');
console.log('icon.png written (512x512)');

await sharp(Buffer.from(svg), { density: 384 })
  .resize(180, 180, { fit: 'contain' })
  .flatten({ background: '#0B3D2E' })
  .png()
  .toFile('src/app/apple-icon.png');
console.log('apple-icon.png written (180x180)');

const png32 = await sharp(Buffer.from(svg), { density: 384 })
  .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// Wrap the PNG in an ICO container (Vista+ PNG-in-ICO, works in all modern browsers)
function pngToIco(png) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // payload size
  entry.writeUInt32LE(22, 12); // offset = 6 + 16
  return Buffer.concat([dir, entry, png]);
}

writeFileSync('src/app/favicon.ico', pngToIco(png32));
writeFileSync('public/favicon.ico', pngToIco(png32));
console.log('favicon.ico written (branded, 32x32)');

// Raster logo for social / structured data (crisp at 2x)
const fullSvg = readFileSync('public/images/logo.svg');
await sharp(Buffer.from(fullSvg), { density: 384 })
  .resize({ width: 428 })
  .png()
  .toFile('public/images/logo.png');
console.log('logo.png written (428px wide)');

// Branded Open Graph card (referenced by layout.tsx metadata)
mkdirSync('public/og-images', { recursive: true });
const ogBg =
  '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#0B3D2E"/><stop offset="1" stop-color="#06251B"/>' +
  '</linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/>' +
  '<text x="600" y="400" text-anchor="middle" font-family="Inter,Segoe UI,sans-serif" ' +
  'font-size="34" font-weight="600" fill="#FFFFFF" fill-opacity="0.85">' +
  'Turn every job into more calls via WhatsApp</text></svg>';
const ogLogo = await sharp(Buffer.from(readFileSync('public/images/logo-white.svg')), { density: 384 })
  .resize({ height: 132 })
  .png()
  .toBuffer();
await sharp(Buffer.from(ogBg))
  .composite([{ input: ogLogo, top: 200, left: 600 - Math.round(132 * (214 / 64) / 2) }])
  .jpeg({ quality: 92 })
  .toFile('public/og-images/neerzy-main.jpg');
console.log('og-images/neerzy-main.jpg written (1200x630)');

console.log('done');
