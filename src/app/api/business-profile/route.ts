import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_phone', phone)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
