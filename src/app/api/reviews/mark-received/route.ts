import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization') || '';
    const { data: { user } } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    let userId: string | null = user?.id || null;

    const body = await req.json();
    const { request_id } = body;

    if (!userId) {
      userId = body.user_id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!request_id) {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
    }

    // Verify the review request belongs to this user
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('review_requests')
      .select('id, status')
      .eq('id', request_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
    }

    if (existing.status === 'review_received') {
      return NextResponse.json({ error: 'Review already marked as received' }, { status: 400 });
    }

    // Update status to review_received
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('review_requests')
      .update({
        status: 'review_received',
        converted_at: new Date().toISOString(),
      })
      .eq('id', request_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to mark review as received:', updateError);
      return NextResponse.json({ error: 'Failed to update review request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Review marked as received!',
    });
  } catch (error: any) {
    console.error('mark-received Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
