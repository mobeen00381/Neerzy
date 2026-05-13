// app/api/debug/twilio-test/route.ts
import twilio from 'twilio';

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = clean.startsWith('+') ? clean : `+${clean}`;
  const to = `whatsapp:${e164}`;

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Log exactly what we're sending
  const params = {
    from: 'whatsapp:+14155238886',
    to: to,
    body: `Test code: 123456`,
  };
  
  console.log('🔍 Sending to Twilio:', JSON.stringify(params, null, 2));

  try {
    const msg = await client.messages.create(params);
    return Response.json({ success: true, sid: msg.sid, params });
  } catch (error: any) {
    console.error('❌ Twilio error:', error.message, error.code);
    return Response.json({ error: error.message, code: error.code }, { status: 500 });
  }
}
