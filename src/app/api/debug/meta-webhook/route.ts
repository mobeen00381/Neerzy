// app/api/debug/meta-webhook/route.ts
import { getPhoneNumberId, getAccessToken } from '@/lib/whatsapp';

export async function GET() {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const businessId = process.env.META_WHATSAPP_BUSINESS_ID;
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
  const templateName = process.env.META_TEMPLATE_REVIEW_REQUEST;
  
  let accessTokenStatus = 'not set';
  try {
    const token = getAccessToken();
    accessTokenStatus = `set (${token.substring(0, 10)}...)`;
  } catch {
    accessTokenStatus = 'NOT SET - ERROR';
  }

  return Response.json({
    timestamp: new Date().toISOString(),
    meta_config: {
      phone_number_id: phoneNumberId || 'NOT SET',
      business_id: businessId || 'NOT SET',
      verify_token: verifyToken ? `${verifyToken.substring(0, 10)}...` : 'NOT SET',
      access_token: accessTokenStatus,
      template_name: templateName || 'NOT SET',
    },
    webhook_url: 'https://neerzy.com/api/whatsapp/webhook',
    instructions: {
      meta_business_manager: 'Go to WhatsApp > API Setup > Webhook Configuration',
      callback_url: 'https://neerzy.com/api/whatsapp/webhook',
      verify_token: verifyToken || 'set META_WHATSAPP_VERIFY_TOKEN in .env.local',
    }
  });
}
