import { NextResponse } from 'next/server';
import { getTranscriptionClient, DEFAULT_ASR_MODEL, ASR_MAX_SECONDS } from '@/lib/openai';
import { guardPublicRequest, TRANSCRIBE_LIMIT } from '@/lib/api-guard';

/**
 * Voice-note → text. Every request is a paid ASR call, and this route is
 * reachable with a one-time quick-post token (no Neerzy session), so it is
 * rate limited per visitor IP: 10/hour, then a 1-hour block.
 */
const TOO_MANY_TRANSCRIPTS =
  'Too many voice notes from this device — please try again later.';

export async function POST(req: Request) {
  try {
    // Rate limit BEFORE the paid ASR call.
    const guard = await guardPublicRequest(req, 'transcribe', TRANSCRIBE_LIMIT, TOO_MANY_TRANSCRIPTS);
    if (!guard.allowed) return guard.response;

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    // Hard 30s lock — the client reports the recorded duration; reject longer audio early.
    const duration = parseFloat(String(formData.get('duration') || '0'));
    if (duration > ASR_MAX_SECONDS) {
      return NextResponse.json(
        { error: `Voice notes must be ${ASR_MAX_SECONDS} seconds or less. Please record a shorter voice note.` },
        { status: 400 }
      );
    }

    // Check if API key is present
    if (!process.env.ZAI_API_KEY) {
      console.warn("ZAI_API_KEY missing, returning placeholder.");
      return NextResponse.json({ text: "Voice note transcribed successfully (simulated fallback due to missing API key)." });
    }

    const client = getTranscriptionClient();

    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model: DEFAULT_ASR_MODEL,
    });

    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    console.error("Transcription error:", err);
    const msg = String(err?.message || err).toLowerCase();
    if (
      msg.includes('30') ||
      msg.includes('too long') ||
      msg.includes('duration') ||
      msg.includes('length') ||
      msg.includes('large') ||
      msg.includes('limit') ||
      msg.includes('exceeds')
    ) {
      return NextResponse.json(
        { error: `Voice notes must be ${ASR_MAX_SECONDS} seconds or less. Please record a shorter voice note.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
