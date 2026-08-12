// app/api/debug/twilio-test/route.ts
// Migrated to Meta WhatsApp Cloud API
import { sendMetaText } from '@/lib/whatsapp';

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = clean.startsWith('+') ? clean : `+${clean}`;

  try {
    const result = await sendMetaText({ to: e164, body: 'Test OTP code: 123456' });
    return Response.json({ success: true, messageId: result.messages?.[0]?.id, to: e164 });
  } catch (error: any) {
    console.error('❌ Meta WhatsApp error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
