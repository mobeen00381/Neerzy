import OpenAI from 'openai';

/**
 * Centralized AI model selection.
 *
 * Primary:   DeepSeek API (deepseek-chat) — OpenAI-compatible, used for ALL text generation.
 * Fallback:  OpenAI API (gpt-4o) — used only when no DeepSeek key is present.
 * Voice:     OpenAI `whisper-1` — DeepSeek has no audio-transcription endpoint, so voice
 *            notes always go through OpenAI (see getTranscriptionClient below).
 *
 * Model auto-selects based on available API keys:
 * - If DEEPSEEK_API_KEY is set → DeepSeek (DEEPSEEK_MODEL, default deepseek-chat)
 * - Else if OPENAI_API_KEY is set → OpenAI (OPENAI_MODEL, default gpt-4o)
 */

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
export const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export const DEFAULT_OPENAI_MODEL =
  process.env.DEEPSEEK_API_KEY
    ? process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    : process.env.OPENAI_API_KEY
      ? process.env.OPENAI_MODEL || 'gpt-4o'
      : process.env.OPENAI_MODEL || process.env.DEEPSEEK_MODEL || 'gpt-4o';

// Vision (image input) is not supported by DeepSeek — keep it on OpenAI.
export const VISION_OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o';

/** Text/chat generation client — DeepSeek when configured, else OpenAI. */
export function getOpenAIClient() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Primary: DeepSeek (OpenAI-compatible API)
  if (deepseekKey) {
    console.log(`🤖 AI Client: DeepSeek primary (model: ${DEFAULT_OPENAI_MODEL})`);
    return new OpenAI({ apiKey: deepseekKey, baseURL: DEEPSEEK_BASE_URL });
  }

  // Fallback: OpenAI
  if (openaiKey) {
    const baseURL = process.env.OPENAI_BASE_URL || OPENAI_BASE_URL;
    console.log(`🤖 AI Client: OpenAI fallback (model: ${DEFAULT_OPENAI_MODEL})`);
    return new OpenAI({ apiKey: openaiKey, baseURL });
  }

  console.warn('⚠️ No AI API keys configured (DEEPSEEK_API_KEY or OPENAI_API_KEY)');
  return new OpenAI({ apiKey: '', baseURL: OPENAI_BASE_URL });
}

/** Voice-note transcription client — always OpenAI (DeepSeek has no audio endpoint). */
export function getTranscriptionClient() {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY is required for voice-note transcription (whisper-1).');
  }
  return new OpenAI({ apiKey: openaiKey, baseURL: OPENAI_BASE_URL });
}
