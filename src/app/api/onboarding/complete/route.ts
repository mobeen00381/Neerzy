import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        user_phone: data.phone,
        business_name: data.businessName,
        address: data.address,
        category: data.category,
        google_place_id: data.google_place_id,
        google_maps_url: data.google_maps_url,
        review_link: data.review_link,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_phone' });

    if (error) {
      console.error('Supabase Onboarding Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding Complete Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save profile' }, { status: 500 });
  }
}
