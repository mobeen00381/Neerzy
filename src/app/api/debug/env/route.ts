// app/api/debug/env/route.ts
export async function GET() {
  return Response.json({
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    whatsappMode: process.env.WHATSAPP_MODE || 'not-set',
  });
}
