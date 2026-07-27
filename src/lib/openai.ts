import OpenAI from 'openai';

/**
 * Centralized OpenAI model selection.
 * Defaults to 'gpt-oss-120b' as requested by the user, customizable via process.env.OPENAI_MODEL.
 */
export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-oss-120b';
export const VISION_OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-oss-120b';

export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}
