// Tiny dependency-free static server so the social gallery gets a real local link.
// Usage: node social/scripts/serve-gallery.mjs [port]
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, normalize } from 'path';

const ROOT = 'C:/Neerzy/social';
const PORT = Number(process.argv[2] || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mjs': 'text/javascript; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^([/\\])+/, '');
    const target = join(ROOT, rel);
    if (!target.startsWith(normalize(ROOT))) { res.writeHead(403).end('forbidden'); return; }

    const info = await stat(target);
    if (info.isDirectory()) { res.writeHead(302, { Location: '/' + rel + '/' }).end(); return; }

    const file = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Neerzy social gallery → http://127.0.0.1:${PORT}/`);
  console.log('Stop it with: Stop-Process -Id <pid>  (or close this terminal)');
});
