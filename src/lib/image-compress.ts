// Browser-side photo compression for the dashboard composer.
//
// Phone cameras routinely produce 4–12 MB JPEG/HEIC images. Base64 inflates
// those by ~33%, and the post body (image + description) then exceeds the
// platform request limit, which surfaced as an opaque 413 after the user had
// already typed the post. Re-encoding to a 1600 px long edge at JPEG 0.8 keeps
// detail well above what Google Business Profile displays while staying far
// below the body limit.

export const MAX_IMAGE_DIMENSION = 1600;
export const IMAGE_JPEG_QUALITY = 0.8;

export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
}

interface RenderedImage {
  dataUrl: string;
  width: number;
  height: number;
}

function fitWithin(width: number, height: number, maxDimension: number) {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

// Base64 payload → approximate decoded byte count, without allocating a buffer.
function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function renderJpeg(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): RenderedImage {
  const { width, height } = fitWithin(sourceWidth, sourceHeight, MAX_IMAGE_DIMENSION);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');

  // JPEG has no alpha channel; transparent PNGs would otherwise turn black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY),
    width,
    height,
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the selected image'));
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read the selected image'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the selected image'));
    img.src = dataUrl;
  });
}

/**
 * Re-encode a gallery file as a bounded JPEG data URL.
 * Throws if the browser cannot decode the file — callers should fall back to
 * `readFileAsDataUrl` so an unusual format never blocks the post flow.
 */
export async function compressImageFile(file: File): Promise<CompressedImage> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) throw new Error('Image has no dimensions');

  const rendered = renderJpeg(img, sourceWidth, sourceHeight);
  return {
    ...rendered,
    originalBytes: file.size,
    compressedBytes: estimateDataUrlBytes(rendered.dataUrl),
  };
}

/** Capture the current camera frame as the same bounded JPEG used for uploads. */
export function captureVideoFrame(video: HTMLVideoElement): CompressedImage | null {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) return null;

  const rendered = renderJpeg(video, sourceWidth, sourceHeight);
  return {
    ...rendered,
    originalBytes: 0,
    compressedBytes: estimateDataUrlBytes(rendered.dataUrl),
  };
}
