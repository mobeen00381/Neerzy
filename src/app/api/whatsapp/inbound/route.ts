import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMetaText } from '@/lib/whatsapp';
import { enrichLocationData } from '@/lib/google';
import { createGBPDraft } from '@/lib/gbp';

/**
 * Maps a phone number to a Trader (User) ID in Neerzy
 */
async function getTraderIdFromPhone(phone: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('whatsapp_number', phone)
    .single();
    
  if (error || !data) {
    console.warn(`⚠️ Unrecognized phone number: ${phone}`);
    return "00000000-0000-0000-0000-000000000000"; // Fallback or handle error
  }
  return data.id;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    console.log(`📱 Inbound WhatsApp from ${from}: ${body}`);

    // Handle "PUBLISHED" reply
    if (body.toUpperCase().trim() === 'PUBLISHED') {
      const { data: pending, error: fetchError } = await supabase
        .from('pending_posts')
        .select('*')
        .eq('phone', from)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pending && !fetchError) {
        const reviewLink = `https://search.google.com/local/writereview?placeid=${pending.place_id}`;
        await sendMetaText({ to: from, body: `🌟 Thanks! Share your experience here:\n${reviewLink}\n\nYour feedback helps us serve ${pending.city} better.` });
        
        await supabase
          .from('pending_posts')
          .update({ status: 'review_sent' })
          .eq('id', pending.id);
      }
      return NextResponse.json({ status: 'reply_handled' });
    }

    // Parse JOB payload: JOB|Name|Service|Address|PhotoURL
    const parts = body.split('|');
    if (parts[0].toUpperCase() !== 'JOB' || parts.length < 4) {
      await sendMetaText({ to: from, body: '❌ Invalid format. Use: JOB|Name|Service|Address|PhotoURL' });
      return NextResponse.json({ error: 'invalid_format' }, { status: 400 });
    }

    const [_, name, service, address, photoUrl = ''] = parts;
    const traderId = await getTraderIdFromPhone(from);

    // 1. Enrich location
    const geo = await enrichLocationData(address);

    // 2. Call Neerzy internally (construct full URL)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const neerzyRes = await fetch(`${appUrl}/api/neerzy/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        service, 
        location: geo.city, 
        category: geo.category, 
        address: geo.address, 
        trader_id: traderId 
      })
    });
    
    if (!neerzyRes.ok) {
      throw new Error(`Neerzy Engine failed: ${neerzyRes.statusText}`);
    }
    
    const aiPost = await neerzyRes.json();

    // 3. Create GBP DRAFT
    const draft = await createGBPDraft(geo.locationId, aiPost, photoUrl);

    // 4. Send Twilio preview
    const gbpLink = `https://business.google.com/edit/${geo.locationId}/posts`;
    await sendMetaText({ to: from, body: `✅ Draft Ready!\n📝 ${aiPost.title}\n\n👉 Review & Publish:\n${gbpLink}\n\nReply "PUBLISHED" when done.` });

    // 5. Log state
    await supabase.from('pending_posts').insert({
      phone: from, 
      trader_id: traderId, 
      place_id: geo.placeId, 
      location_id: geo.locationId, 
      draft_name: draft.name, 
      city: geo.city, 
      status: 'draft_created'
    });

    return NextResponse.json({ status: 'queued' });
  } catch (err: any) {
    console.error("❌ WhatsApp Webhook Error:", err);
    // Attempt to notify user of failure
    try {
      const formData = await req.formData();
      const from = formData.get('From') as string;
      if (from) await sendMetaText({ to: from, body: '⚠️ System error while processing your job. Please try again or contact support.' });
    } catch {}
    
    return NextResponse.json({ error: 'failed', message: err.message }, { status: 500 });
  }
}
