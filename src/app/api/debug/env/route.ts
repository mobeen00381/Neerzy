// app/api/debug/env/route.ts
export async function GET() {
  return Response.json({
    // Meta WhatsApp (new)
    hasMetaToken: !!process.env.META_WHATSAPP_ACCESS_TOKEN,
    hasMetaPhoneNumberId: !!process.env.META_WHATSAPP_PHONE_NUMBER_ID,
    hasMetaBusinessId: !!process.env.META_WHATSAPP_BUSINESS_ID,
    // Legacy Twilio (deprecated)
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
    // Supabase
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    whatsappMode: 'meta_cloud_api',
  });
}
