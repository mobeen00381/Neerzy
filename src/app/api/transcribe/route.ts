import { NextResponse } from 'next/server';
import { getTranscriptionClient, DEFAULT_ASR_MODEL, ASR_MAX_SECONDS } from '@/lib/openai';

export async function POST(req: Request) {
  try {
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
