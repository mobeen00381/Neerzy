import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    await supabase.from('otp_verifications').insert({
      phone: formattedPhone,
      otp_hash: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });

    // ✅ META CLOUD API - NO TWILIO
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'code',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }]
              }
            ]
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Meta API Error:', err);
      throw new Error(err.error?.message || 'Meta API failed');
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('OTP Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send OTP' 
    }, { status: 500 });
  }
}
