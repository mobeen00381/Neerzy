import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getBusinessProfileForUser } from '@/lib/business-profile';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * The signed-in user's business profile.
 *
 * Two problems used to live here:
 *   1. it accepted `?phone=` with no auth, so any phone number returned that
 *      business's name/address/place id to anyone; and
 *   2. the dashboard ALSO read business_profiles straight from the browser,
 *      where RLS (service-role only) silently returned nothing — which is why
 *      the own-country domain suggestion never worked.
 *
 * The session is now the source of truth and the profile is resolved by OWNER
 * id first (email/Google accounts have no phone at all), with the phone as the
 * legacy fallback for WhatsApp-era rows.
 */
export async function GET(req: Request) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authData.user;
    const meta = (user.user_metadata || {}) as Record<string, string>;

    // profiles.phone is the WhatsApp link; metadata/auth cover the rest.
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();
    const phone = user.phone || profileRow?.phone || meta.phone_number || meta.phone || null;

    const data = await getBusinessProfileForUser(supabase, user.id, phone);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
