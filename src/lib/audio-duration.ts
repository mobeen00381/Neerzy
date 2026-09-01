/**
 * Best-effort audio duration estimation used to enforce the GLM-ASR 30-second lock
 * on WhatsApp voice notes (which we cannot restrict on the client side).
 *
 * Supports Ogg/Opus (WhatsApp voice notes) by reading the last Ogg page's granule
 * position. Returns null when the duration cannot be determined — callers should
 * then fall back to the ASR API's own length validation.
 */
export function estimateAudioSeconds(buffer: ArrayBuffer | Buffer, mimeType?: string): number | null {
  const type = (mimeType || '').toLowerCase();

  if (type.includes('ogg') || type.includes('opus')) {
    const bytes = buffer instanceof Buffer ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);
    let maxGranule = -1;

    for (let i = 0; i + 27 <= bytes.length; i++) {
      // "OggS" capture pattern
      if (bytes[i] === 0x4f && bytes[i + 1] === 0x67 && bytes[i + 2] === 0x67 && bytes[i + 3] === 0x53) {
        const version = bytes[i + 4];
        if (version !== 0) continue;

        const granuleLo =
          bytes[i + 6] | (bytes[i + 7] << 8) | (bytes[i + 8] << 16) | (bytes[i + 9] << 24);
        const granuleHi =
          bytes[i + 10] | (bytes[i + 11] << 8) | (bytes[i + 12] << 16) | (bytes[i + 13] << 24);
        const granule = granuleLo + granuleHi * 4294967296;

        if (granule > maxGranule) maxGranule = granule;

        // Skip past this page's segment table + payload to the next page header.
        const segCount = bytes[i + 26];
        let pageLen = 27 + segCount;
        for (let s = 0; s < segCount; s++) pageLen += bytes[i + 27 + s];
        i += pageLen - 1;
      }
    }

    if (maxGranule > 0) {
      // Opus always decodes at 48 kHz.
      return maxGranule / 48000;
    }
  }

  return null;
}
