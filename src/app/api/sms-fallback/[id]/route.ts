import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SMS fallback data for a review request.
 * Used by the /sms/[id] page that traders open from the WhatsApp CTA button
 * when a review request could not be delivered on WhatsApp.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`[SMS fallback] Looking up review request: ${id}`);

    const { data: row, error } = await supabase
      .from('review_requests')
      .select('id, user_id, customer_name, customer_phone, review_link')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[SMS fallback] DB error:', error.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!row) {
      console.warn(`[SMS fallback] No review_requests row for id: ${id}`);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Resolve the trader's phone (profiles -> legacy users) so we can look up
    // the business name, mirroring the webhook's getPhoneByUserId logic.
    let traderPhone: string | null = null;
    if (row.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', row.user_id)
        .maybeSingle();
      traderPhone = profile?.phone || null;
      if (!traderPhone) {
        const { data: legacy } = await supabase
          .from('users')
          .select('phone')
          .eq('id', row.user_id)
          .maybeSingle();
        traderPhone = legacy?.phone || null;
      }
    }

    let businessName = '';
    if (traderPhone) {
      try {
        const { data: biz } = await supabase
          .from('business_profiles')
          .select('business_name')
          .eq('user_phone', traderPhone)
          .maybeSingle();
        businessName = biz?.business_name || '';
      } catch (bizErr: any) {
        console.warn('[SMS fallback] Failed to load business name:', bizErr?.message || bizErr);
      }
    }

    const customerName = (row.customer_name || '').trim() || 'Customer';
    const biz = (businessName || '').trim() || 'us';
    const reviewLink = (row.review_link || '').trim();
    const smsText = `Hi ${customerName}, thanks for choosing ${biz} today! Could you take 30 seconds to leave us a Google review? ${reviewLink}`.trimEnd();

    return NextResponse.json(
      {
        customerName,
        customerPhone: row.customer_phone || '',
        smsText,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('[SMS fallback] Server error:', error?.message || error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}