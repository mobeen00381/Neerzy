// lib/audio-convert.ts
// ─────────────────────────────────────────────────────────────
// WhatsApp voice notes arrive as OGG/Opus, but the GLM-ASR-2512
// endpoint only accepts .wav / .mp3 (see Z.AI API reference:
// "Supported audio file formats: .wav / .mp3"). This helper decodes
// OGG/Opus in-process (pure WASM — no ffmpeg / native binaries, so it
// runs on Vercel serverless) and re-encodes the audio as a 16 kHz
// mono 16-bit PCM WAV that GLM-ASR accepts.
//
// GLM-ASR only accepts .wav/.mp3, so a failure here must NOT fall back to
// uploading the original buffer (Z.AI rejects every other format with a 400,
// code 1214). Callers treat a null return as a hard failure: they skip the
// ASR call entirely and send the trader a friendly retry message instead.
// Every null return below logs *why* so failures are diagnosable from the
// server logs.
// ─────────────────────────────────────────────────────────────
import OggOpusDecoder from './vendor/audio/ogg-opus-decoder.js';

/** GLM-ASR accepts any .wav; 16 kHz mono is the safest cross-format target. */
export const WAV_SAMPLE_RATE = 16000;

export interface WavConversion {
  /** Complete 16-bit PCM WAV file bytes (RIFF container). */
  wav: Uint8Array<ArrayBuffer>;
  /** Decoded audio duration in seconds (from the Ogg granule position). */
  seconds: number;
}

/** True when the buffer + mime type look like an Ogg/Opus stream. */
function isOggOpus(bytes: Uint8Array, mimeType?: string): boolean {
  const type = (mimeType || '').toLowerCase();
  if (type.includes('ogg') || type.includes('opus')) return true;
  // Fallback: sniff the "OggS" capture pattern (4-byte page marker).
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  );
}

/** Downmix any channel count to mono (average). */
function toMono(channelData: Float32Array[], sampleCount: number): Float32Array {
  if (channelData.length === 1) return channelData[0].slice(0, sampleCount);
  const mono = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    let sum = 0;
    for (const ch of channelData) sum += ch[i] || 0;
    mono[i] = sum / channelData.length;
  }
  return mono;
}

/**
 * Linear-interpolation resample. Decent enough for speech (ASR input);
 * avoids pulling in a full DSP dependency on serverless.
 */
function resample(input: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (srcRate === dstRate || input.length === 0) return input;
  const dstLen = Math.max(1, Math.round((input.length * dstRate) / srcRate));
  const out = new Float32Array(dstLen);
  const step = (input.length - 1) / (dstLen - 1);
  for (let i = 0; i < dstLen; i++) {
    const pos = i * step;
    const idx = Math.min(Math.floor(pos), input.length - 1);
    const next = Math.min(idx + 1, input.length - 1);
    const frac = pos - idx;
    out[i] = input[idx] + (input[next] - input[idx]) * frac;
  }
  return out;
}

/** Encode float samples in [-1, 1] as a 16-bit PCM mono WAV file. */
function encodeWavPcm16(samples: Float32Array, sampleRate: number): Uint8Array<ArrayBuffer> {
  const dataLen = samples.length * 2;
  const wav = new ArrayBuffer(44 + dataLen);
  const view = new DataView(wav);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size (PCM)
  view.setUint16(20, 1, true); // audio format = linear PCM
  view.setUint16(22, 1, true); // channels = mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, dataLen, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return new Uint8Array(wav);
}

/**
 * Decode an OGG/Opus voice note into a GLM-ASR-ready 16 kHz mono WAV.
 *
 * Returns `null` (with a `console.warn`/`console.error` explaining why) when the
 * input is not Ogg/Opus or decoding fails. GLM-ASR only accepts .wav/.mp3, so
 * callers must treat a null return as a hard failure and skip the ASR call.
 */
export async function convertOggOpusToWav(
  buffer: ArrayBuffer | Buffer,
  mimeType?: string
): Promise<WavConversion | null> {
  const bytes =
    buffer instanceof Buffer
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : new Uint8Array(buffer);

  if (!isOggOpus(bytes, mimeType)) {
    const preview = Array.from(bytes.slice(0, 12))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.warn(
      `⚠️ OGG/Opus → WAV skipped: input is not Ogg/Opus (mime: ${mimeType || 'unknown'}, size: ${bytes.byteLength} B, first bytes: ${preview})`
    );
    return null;
  }

  let decoder: OggOpusDecoder | null = null;
  try {
    decoder = new OggOpusDecoder();
    await decoder.ready;
    const { channelData, samplesDecoded, sampleRate } = await decoder.decodeFile(bytes);
    if (!samplesDecoded || !channelData?.length) {
      console.warn(
        `⚠️ OGG/Opus → WAV decoded 0 samples (samplesDecoded=${samplesDecoded}, channels=${channelData?.length ?? 0}, input=${bytes.byteLength} B)`
      );
      return null;
    }

    const mono = toMono(channelData, samplesDecoded);
    const pcm = resample(mono, sampleRate, WAV_SAMPLE_RATE);
    return {
      wav: encodeWavPcm16(pcm, WAV_SAMPLE_RATE),
      seconds: samplesDecoded / sampleRate,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ OGG/Opus → WAV conversion failed (input ${bytes.byteLength} B):`, msg);
    return null;
  } finally {
    try {
      decoder?.free();
    } catch {
      // ignore teardown errors — decoder is already unusable
    }
  }
}
