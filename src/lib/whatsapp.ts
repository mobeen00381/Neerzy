/**
 * Meta WhatsApp Cloud API Client
 * Sends WhatsApp messages via the WhatsApp Business Cloud API (Meta).
 * 
 * API Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Required env vars:
 *   META_WHATSAPP_ACCESS_TOKEN  - Permanent system user access token
 *   META_WHATSAPP_PHONE_NUMBER_ID - The WhatsApp phone number ID (e.g. 1256240127573258)
 */

const META_API_VERSION = "v22.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

function getPhoneNumberId(): string {
  const id = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("META_WHATSAPP_PHONE_NUMBER_ID is not set");
  return id;
}

function getAccessToken(): string {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("META_WHATSAPP_ACCESS_TOKEN is not set");
  return token;
}

// Export for use in webhook route.ts
export { getPhoneNumberId, getAccessToken };

function normalizeTo(to: string): string {
  return to.replace(/^whatsapp:/, "").replace(/[^\d+]/g, "");
}

interface MetaResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: { message: string; type: string; code: number };
}

interface SendTextParams {
  to: string;
  body: string;
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: "header" | "body" | "button";
    parameters?: Array<{
      type: "text" | "currency" | "date_time" | "image" | "document" | "video";
      text?: string;
      currency?: { fallback_value: string; code: string; amount_1000: number };
      date_time?: { fallback_value: string };
      image?: { link: string };
      document?: { link: string };
      video?: { link: string };
    }>;
    sub_type?: string;
    index?: string;
  }>;
}

interface SendMediaParams {
  to: string;
  mediaUrl: string;
  caption?: string;
  mediaType?: "image" | "video" | "document" | "audio";
  filename?: string;
}

async function callMetaAPI(endpoint: string, body: Record<string, unknown>): Promise<MetaResponse> {
  const url = `${META_BASE_URL}/${getPhoneNumberId()}/${endpoint}`;
  const token = getAccessToken();

  console.log(`📤 [Meta WhatsApp] POST ${url}`);
  console.log(`📤 [Meta WhatsApp] Body:`, JSON.stringify(body).substring(0, 200));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data: MetaResponse = await response.json();

  if (!response.ok || data.error) {
    const errCode = data.error?.code || response.status;
    const errMsg = data.error?.message || `HTTP ${response.status}`;
    console.error(`❌ [Meta WhatsApp] Error (${errCode}):`, errMsg);
    // Include the numeric Meta error code in the thrown message (e.g.
    // 131026 = number not registered on WhatsApp) so callers can detect and
    // surface the real delivery failure instead of a generic "send failed".
    throw new Error(`Meta WhatsApp API Error (${errCode}): ${errMsg}`);
  }

  console.log(`✅ [Meta WhatsApp] Message sent! ID: ${data.messages?.[0]?.id}`);
  return data;
}


/**
 * Sends a free-form text message via Meta WhatsApp Cloud API.
 * ⚠️ Only works within 24 hours of the customer's last message (Meta policy).
 * For outbound-initiated messages, use sendMetaTemplate instead.
 */
export async function sendMetaText({ to, body }: SendTextParams): Promise<MetaResponse> {
  return callMetaAPI("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeTo(to),
    type: "text",
    text: { preview_url: false, body },
  });
}

/**
 * Sends a template message via Meta WhatsApp Cloud API.
 * Templates must be pre-approved in Meta Business Manager.
 * 
 * For review request template, pass components like:
 * { type: "body", parameters: [
 *   { type: "text", text: "Mike" },
 *   { type: "text", text: "Neerzy" },
 *   { type: "text", text: "https://..." }
 * ]}
 */
export async function sendMetaTemplate(params: SendTemplateParams): Promise<MetaResponse> {
  const { to, templateName, languageCode = "en", components = [] } = params;
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeTo(to),
    type: "template",
    template: { name: templateName, language: { code: languageCode } },
  };
  if (components.length > 0) {
    (body.template as Record<string, unknown>).components = components;
  }
  return callMetaAPI("messages", body);
}

/**
 * Sends a media message (image, video, document, or audio) via Meta WhatsApp Cloud API.
 */
export async function sendMetaMedia({ to, mediaUrl, caption, mediaType = "image", filename }: SendMediaParams): Promise<MetaResponse> {
  const mediaPayload: Record<string, unknown> = { link: mediaUrl };
  if (caption) mediaPayload.caption = caption;
  if (filename) mediaPayload.filename = filename;
  return callMetaAPI("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeTo(to),
    type: mediaType,
    [mediaType]: mediaPayload,
  });
}

/**
 * Sends a location message with coordinates and optional name/address.
 */
export async function sendMetaLocation(
  to: string, latitude: number, longitude: number,
  name?: string, address?: string
): Promise<MetaResponse> {
  const payload: Record<string, unknown> = { latitude, longitude };
  if (name) payload.name = name;
  if (address) payload.address = address;
  return callMetaAPI("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeTo(to),
    type: "location",
    location: payload,
  });
}

/**
 * Marks a message as "read" (sends read receipt back to Meta).
 */
export async function sendMetaReadReceipt(messageId: string): Promise<void> {
  await callMetaAPI("messages", {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

interface SendInteractiveUrlParams {
  to: string;
  bodyText: string;
  displayText: string;
  url: string;
}

/**
 * Sends an interactive cta_url button message (one-tap URL button).
 * cta_url is allowed in-session - no template approval needed.
 */
export async function sendMetaInteractiveUrlButton({ to, bodyText, displayText, url }: SendInteractiveUrlParams): Promise<MetaResponse> {
  return callMetaAPI("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeTo(to),
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: bodyText },
      action: {
        name: "cta_url",
        parameters: { display_text: displayText, url },
      },
    },
  });
}
