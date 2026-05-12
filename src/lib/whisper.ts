import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

export async function transcribeAudio(mediaUrl: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ No OPENAI_API_KEY found, returning mocked transcription.");
    return "Mocked transcription of voice note. Customer needs pipe fixed ASAP.";
  }

  try {
    const response = await axios({ url: mediaUrl, responseType: 'arraybuffer' });
    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.ogg`);
    fs.writeFileSync(tempPath, response.data);

    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath));
    form.append('model', 'whisper-1');

    const result = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    fs.unlinkSync(tempPath);
    return result.data.text;
  } catch (error) {
    console.error("Whisper Transcription error:", error);
    return "Error transcribing audio.";
  }
}
