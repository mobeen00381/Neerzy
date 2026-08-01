import OpenAI from 'openai';

/**
 * Centralized AI model selection.
 * Primary: OpenAI API (gpt-4o)
 * Backup: DeepSeek API (deepseek-chat) — OpenAI-compatible
 *
 * Model auto-selects based on available API keys:
 * - If OPENAI_API_KEY is set → uses OpenAI with gpt-4o
 * - Else if DEEPSEEK_API_KEY is set → uses DeepSeek with deepseek-chat
 */
export const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_API_KEY
    ? process.env.OPENAI_MODEL || 'gpt-4o'
    : process.env.DEEPSEEK_API_KEY
      ? process.env.DEEPSEEK_MODEL || 'deepseek-chat'
      : process.env.OPENAI_MODEL || 'gpt-4o';

export const VISION_OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || DEFAULT_OPENAI_MODEL;

export function getOpenAIClient() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  // Primary: OpenAI
  if (openaiKey) {
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    console.log(`🤖 AI Client: OpenAI primary (model: ${DEFAULT_OPENAI_MODEL})`);
    return new OpenAI({ apiKey: openaiKey, baseURL });
  }

  // Backup: DeepSeek (OpenAI-compatible API)
  if (deepseekKey) {
    const baseURL = 'https://api.deepseek.com/v1';
    console.log(`🤖 AI Client: DeepSeek backup (model: ${DEFAULT_OPENAI_MODEL})`);
    return new OpenAI({ apiKey: deepseekKey, baseURL });
  }

  console.warn('⚠️ No AI API keys configured (OPENAI_API_KEY or DEEPSEEK_API_KEY)');
  return new OpenAI({ apiKey: '', baseURL: 'https://api.openai.com/v1' });
}
