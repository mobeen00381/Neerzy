import OpenAI from 'openai';

/**
 * Centralized AI model selection.
 *
 * Primary:   GLM (Z.AI) — `glm-5.3-flash`, OpenAI-compatible, natively multimodal (text + vision).
 * Backup:    DeepSeek API (`deepseek-chat` / `deepseek-v4-flash-vision-exp`) — OpenAI-compatible,
 *            used automatically when GLM fails or no ZAI_API_KEY is present.
 * Voice:     GLM-ASR-2512 (Z.AI) — the ONLY speech-to-text provider. Voice notes are locked to
 *            ≤ ASR_MAX_SECONDS (30s), so no audio fallback is needed.
 *
 * OpenAI (ChatGPT / Whisper) is no longer used anywhere in the app.
 *
 * Model auto-selects based on available API keys:
 * - If ZAI_API_KEY is set     → GLM primary (ZAI_MODEL, default glm-5.3-flash)
 * - Else if DEEPSEEK_API_KEY  → DeepSeek (DEEPSEEK_MODEL, default deepseek-chat)
 */

export const GLM_BASE_URL = 'https://api.z.ai/api/paas/v4';
export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

/** Hard cap for GLM-ASR-2512 — voice notes longer than this are rejected everywhere. */
export const ASR_MAX_SECONDS = 30;

const glmKey = process.env.ZAI_API_KEY;
const deepseekKey = process.env.DEEPSEEK_API_KEY;

/** Text/chat model of the currently-selected primary provider. */
export const DEFAULT_OPENAI_MODEL = glmKey
  ? process.env.ZAI_MODEL || 'glm-5.3-flash'
  : process.env.DEEPSEEK_MODEL || 'deepseek-chat';

/** Vision model of the currently-selected provider (GLM is natively multimodal). */
export const DEFAULT_VISION_MODEL = glmKey
  ? process.env.ZAI_VISION_MODEL || 'glm-5.3-flash'
  : process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-flash-vision-exp';

/** Speech-to-text model (GLM-ASR only). */
export const DEFAULT_ASR_MODEL = process.env.ZAI_ASR_MODEL || 'glm-asr-2512';

type NonStreamParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;

function makeClient(apiKey: string, baseURL: string) {
  return new OpenAI({ apiKey, baseURL });
}

/** Text/chat client — GLM when configured, else DeepSeek. */
export function getOpenAIClient() {
  if (glmKey) {
    console.log(`🤖 AI Client: GLM primary (model: ${DEFAULT_OPENAI_MODEL})`);
    return makeClient(glmKey, GLM_BASE_URL);
  }
  if (deepseekKey) {
    console.log(`🤖 AI Client: DeepSeek fallback (model: ${DEFAULT_OPENAI_MODEL})`);
    return makeClient(deepseekKey, DEEPSEEK_BASE_URL);
  }
  console.warn('⚠️ No AI API keys configured (ZAI_API_KEY or DEEPSEEK_API_KEY)');
  return makeClient('', GLM_BASE_URL);
}

/** Vision-capable client — same providers as text (both support image input). */
export function getVisionClient() {
  return getOpenAIClient();
}

/**
 * Voice-note transcription client — GLM-ASR only (no OpenAI Whisper).
 * Voice notes are capped at ASR_MAX_SECONDS upstream, so no audio fallback is needed.
 */
export function getTranscriptionClient() {
  if (!glmKey) {
    throw new Error('ZAI_API_KEY is required for voice-note transcription (glm-asr-2512).');
  }
  return makeClient(glmKey, GLM_BASE_URL);
}

/**
 * Chat completion with automatic runtime fallback: tries GLM first, then retries the
 * same request via DeepSeek when GLM errors, is rate-limited, or times out.
 * `opts.vision` selects the vision model of each provider instead of the text model.
 * `opts.priority` (Growth/Agency "priority processing"): when GLM is busy or
 * rate-limited, retry GLM once after a short backoff BEFORE falling back to
 * DeepSeek — priority users get the best model first, standard users fall back
 * immediately.
 */
export async function chatWithFallback(
  params: Omit<NonStreamParams, 'model'>,
  opts?: { vision?: boolean; priority?: boolean },
  requestOpts?: OpenAI.RequestOptions
): Promise<ChatCompletion> {
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  if (glmKey) {
    try {
      const model = opts?.vision ? DEFAULT_VISION_MODEL : DEFAULT_OPENAI_MODEL;
      return await makeClient(glmKey, GLM_BASE_URL).chat.completions.create(
        { ...params, model },
        requestOpts
      );
    } catch (glmErr: any) {
      // Priority users: give GLM one more chance after a short backoff before
      // accepting a DeepSeek fallback (or failing when no fallback is set).
      if (opts?.priority) {
        try {
          await delay(700);
          const model = opts?.vision ? DEFAULT_VISION_MODEL : DEFAULT_OPENAI_MODEL;
          return await makeClient(glmKey, GLM_BASE_URL).chat.completions.create(
            { ...params, model },
            requestOpts
          );
        } catch (glmRetryErr: any) {
          console.warn(`⚠️ [priority] GLM retry failed, falling back: ${glmRetryErr?.message || glmRetryErr}`);
          if (!deepseekKey) throw glmRetryErr;
        }
      }
      if (!deepseekKey) throw glmErr;
      console.warn(`⚠️ GLM failed, retrying via DeepSeek fallback: ${glmErr?.message || glmErr}`);
      const dsModel = opts?.vision
        ? process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-flash-vision-exp'
        : process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      return await makeClient(deepseekKey, DEEPSEEK_BASE_URL).chat.completions.create(
        { ...params, model: dsModel },
        requestOpts
      );
    }
  }
  if (deepseekKey) {
    const dsModel = opts?.vision
      ? process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-flash-vision-exp'
      : process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    return await makeClient(deepseekKey, DEEPSEEK_BASE_URL).chat.completions.create(
      { ...params, model: dsModel },
      requestOpts
    );
  }
  throw new Error('No AI API keys configured (ZAI_API_KEY or DEEPSEEK_API_KEY).');
}
