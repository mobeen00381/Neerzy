import OpenAI from 'openai';

/**
 * Centralized OpenAI model selection.
 * Uses Together AI's OpenAI-compatible API endpoint.
 * Model defaults to 'openai/gpt-oss-120b' on Together AI, customizable via process.env.OPENAI_MODEL.
 */
export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'openai/gpt-oss-120b';
export const VISION_OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-oss-120b';

export function getOpenAIClient() {
  // Use Together AI API key if available, otherwise fall back to OpenAI key
  const apiKey = process.env.TOGETHER_API_KEY || process.env.OPENAI_API_KEY || '';
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.together.xyz/v1';
  
  console.log(`🤖 OpenAI Client initialized with baseURL: ${baseURL}`);
  
  return new OpenAI({
    apiKey,
    baseURL,
  });
}
