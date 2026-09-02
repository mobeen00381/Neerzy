# Vendored audio decoder (worker-free)

Files in this directory are adapted from the MIT-licensed
[eshaz/wasm-audio-decoders](https://github.com/eshaz/wasm-audio-decoders)
project (copyright Ethan Halsall):

- `ogg-opus-decoder.js` — from `src/ogg-opus-decoder` (MIT). Trimmed to remove the
  Web Worker variants and the Opus-ML decoder so the module graph never pulls in
  `@eshaz/web-worker`, which Next.js/Turbopack cannot bundle. Decode logic is
  otherwise identical to upstream.
- `opus-decoder.js` — from `src/opus-decoder` (MIT). Import paths repointed at the
  sibling vendored files.
- `wasm-audio-common.js` — from `@wasm-audio-decoders/common` (MIT).
- `emscripten-wasm.js` — from `src/opus-decoder` (MIT). This is the auto-generated
  Emscripten build of libopus (BSD-licensed) with its compressed WASM payload
  embedded as a string.

Runtime npm dependencies used by these files:
- `codec-parser` (LGPL-3.0-or-later) — pure-JS Ogg demuxing (server-side only).
- `simple-yenc` (MIT) — decodes the yEnc-compressed libopus WASM payload.

Why vendored: the npm packages export both a main class and a Web Worker class;
bundling the worker class drags in `@eshaz/web-worker`'s dynamic `import()`,
which fails Turbopack's server build with `Module not found`. These files use
only the worker-free path.
