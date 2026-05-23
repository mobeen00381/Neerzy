import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    // Check if API key is present
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key missing, returning placeholder.");
      return NextResponse.json({ text: "Voice note transcribed successfully (simulated fallback due to missing API key)." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
