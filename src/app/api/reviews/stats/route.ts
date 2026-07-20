import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization') || '';
    const { data: { user } } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    let userId: string | null = user?.id || null;

    const url = new URL(req.url);
    if (!userId) {
      userId = url.searchParams.get('user_id');
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get total sent
    const { count: totalSent } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total received (converted)
    const { count: totalReceived } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'review_received');

    // Get sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: sentToday } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', todayStart.toISOString());

    // Get this month's data
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: sentThisMonth } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', monthStart.toISOString());

    const { count: receivedThisMonth } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'review_received')
      .gte('converted_at', monthStart.toISOString());

    // Calculate conversion rate
    const conversionRate = totalSent && totalSent > 0
      ? Math.round(((totalReceived || 0) / totalSent) * 100)
      : 0;

    // Get recent requests for the list view
    const { data: recentRequests } = await supabaseAdmin
      .from('review_requests')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: {
        total_sent: totalSent || 0,
        total_received: totalReceived || 0,
        sent_today: sentToday || 0,
        sent_this_month: sentThisMonth || 0,
        received_this_month: receivedThisMonth || 0,
        conversion_rate: conversionRate,
        recent_requests: recentRequests || [],
      },
    });
  } catch (error: any) {
    console.error('reviews/stats Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
