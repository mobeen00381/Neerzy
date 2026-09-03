import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCycleStartIso } from '@/lib/plans';
import {
  AGENCY_MAX_CLIENTS,
  getAgencyClientPhones,
  countAgencyPoolPosts,
  countAgencyPoolReviews,
  countAgencyTraderPosts,
  countAgencyTraderReviews,
} from '@/lib/agency';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Agency "My Traders" API — list / add / remove trader clients.
// Only accounts on the Agency plan can use this.
// GET           → traders + per-trader usage + agency pool usage
// POST add      → { action:'add', phone, name }
// POST remove   → { action:'remove', id }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('selected_plan, plan_started_at, trial_started_at, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if ((profile?.selected_plan || 'free').toLowerCase() !== 'agency') {
      return NextResponse.json({ error: 'Agency plan required' }, { status: 403 });
    }

    const cycleStartIso = getCycleStartIso(profile?.plan_started_at || profile?.trial_started_at || profile?.created_at);

    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('*')
      .eq('agency_user_id', user.id)
      .order('created_at', { ascending: true });

    const phones = (clients || []).map(c => c.client_phone);
    const poolPosts = await countAgencyPoolPosts(user.id, cycleStartIso);
    const poolReviews = await countAgencyPoolReviews(user.id, phones, cycleStartIso);

    const traderRows = [];
    for (const c of clients || []) {
      const posts = await countAgencyTraderPosts(c.client_phone, cycleStartIso);
      const reviews = await countAgencyTraderReviews(c.client_phone, cycleStartIso);
      traderRows.push({
        id: c.id,
        client_name: c.client_name,
        client_phone: c.client_phone,
        status: c.status,
        created_at: c.created_at,
        posts_used: posts.total,
        reviews_sent: reviews.total,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        max_clients: AGENCY_MAX_CLIENTS,
        traders: traderRows,
        pool: {
          posts_used: poolPosts.total,
          posts_daily_used: poolPosts.daily,
          posts_limit: 300,
          reviews_used: poolReviews.total,
          reviews_daily_used: poolReviews.daily,
          reviews_limit: 300,
        },
      },
    });

  } catch (error: any) {
    console.error('agency/clients GET error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('selected_plan')
      .eq('id', user.id)
      .maybeSingle();

    if ((profile?.selected_plan || 'free').toLowerCase() !== 'agency') {
      return NextResponse.json({ error: 'Agency plan required' }, { status: 403 });
    }

    const body = await req.json();
    const action = body?.action;

    if (action === 'add') {
      const phone = String(body?.phone || '').replace(/[^\d+]/g, '');
      const name = String(body?.name || '').trim();
      if (phone.length < 8) {
        return NextResponse.json({ error: 'Enter the trader\'s WhatsApp number, e.g. +15551234567' }, { status: 400 });
      }

      const { count: existingCount } = await supabaseAdmin
        .from('agency_clients')
        .select('*', { count: 'exact', head: true })
        .eq('agency_user_id', user.id);
      if ((existingCount || 0) >= AGENCY_MAX_CLIENTS) {
        return NextResponse.json({ error: `Agency plan supports up to ${AGENCY_MAX_CLIENTS} traders` }, { status: 403 });
      }

      const { data: existing } = await supabaseAdmin
        .from('agency_clients')
        .select('id')
        .eq('agency_user_id', user.id)
        .eq('client_phone', phone)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: 'That WhatsApp number is already on your agency' }, { status: 400 });
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('agency_clients')
        .insert({ agency_user_id: user.id, client_phone: phone, client_name: name || null, status: 'invited' })
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, trader: inserted });
    }

    if (action === 'remove') {
      const id = String(body?.id || '');
      if (!id) return NextResponse.json({ error: 'Missing trader id' }, { status: 400 });
      const { error } = await supabaseAdmin
        .from('agency_clients')
        .delete()
        .eq('id', id)
        .eq('agency_user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('agency/clients POST error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

