import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS } from '@/lib/plans';
import { sendMetaTemplate } from '@/lib/whatsapp';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    // Parse body once — must clone before reading since .json() consumes the stream
    const body = await req.json();

    // Try to get user from auth header or session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (user) {
      userId = user.id;
    } else {
      // Fallback: try to get from the request body
      userId = body.user_id || null;
      
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    const { to: customerPhone, review_link, trader_name, customer_name, user_phone } = body;

    if (!customerPhone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
    }

    if (!review_link) {
      return NextResponse.json({ error: 'Review link is required' }, { status: 400 });
    }

    // Get user's profile for plan quota checking and phone lookup
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('selected_plan, phone')
      .eq('id', userId)
      .maybeSingle();

    const planTier = profile?.selected_plan || 'free';
    const planLimits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Check total review request quota
    const { count: totalSent, error: totalCountError } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalCountError) {
      console.error('Error counting total review requests:', totalCountError.message || totalCountError);
    }

    if (totalSent !== null && planLimits.totalReviewRequests !== -1 && totalSent >= planLimits.totalReviewRequests) {
      return NextResponse.json({
        error: `You've reached your plan limit of ${planLimits.totalReviewRequests} review requests. Upgrade to send more.`
      }, { status: 403 });
    }

    // Check daily review request quota
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: dailySent, error: dailyCountError } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', todayStart.toISOString());

    if (dailyCountError) {
      console.error('Error counting daily review requests:', dailyCountError.message || dailyCountError);
    }

    if (dailySent !== null && planLimits.dailyReviewRequests !== -1 && dailySent >= planLimits.dailyReviewRequests) {
      return NextResponse.json({
        error: `Daily limit of ${planLimits.dailyReviewRequests} review requests reached. Try again tomorrow.`
      }, { status: 403 });
    }

    // Generate the WhatsApp message
    const customerName = customer_name || trader_name || 'Valued Customer';
    const messageText = `Hi ${customerName}! 👋\n\nThank you for choosing ${trader_name || 'our business'}! We'd really appreciate it if you could leave us a quick review. It helps us grow!\n\n🔗 Review link: ${review_link}`;

    // Resolve the business profile robustly:
    // 1. body.user_phone (now sent by ReviewsManager)
    // 2. Look up profiles.phone → business_profiles.user_phone
    // 3. Auth user metadata phone
    // 4. If nothing found, still insert with business_id: null — never fail
    let businessId: string | null = null;

    if (user_phone) {
      const { data: bizProfile } = await supabaseAdmin
        .from('business_profiles')
        .select('id')
        .eq('user_phone', user_phone)
        .maybeSingle();

      if (bizProfile?.id) {
        businessId = bizProfile.id;
      }
    }

    // Fallback: try via profiles.phone
    if (!businessId) {
      const phoneFromProfile = profile?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number;
      if (phoneFromProfile) {
        const { data: bizByPhone } = await supabaseAdmin
          .from('business_profiles')
          .select('id')
          .eq('user_phone', phoneFromProfile)
          .maybeSingle();

        if (bizByPhone?.id) {
          businessId = bizByPhone.id;
        }
      }
    }

    // Insert the review request record
    let { data: reviewRequest, error: insertError } = await supabaseAdmin
      .from('review_requests')
      .insert({
        user_id: userId,
        business_id: businessId,
        customer_name: customerName,
        customer_phone: customerPhone,
        message_text: messageText,
        review_link: review_link,
        status: 'sent',
        sent_via: 'whatsapp',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    // If insert fails with PGRST204 (missing column in production schema),
    // retry without business_id so the API doesn't 500 before the migration runs
    if (insertError) {
      const isPGRST204 = (insertError as any)?.code === 'PGRST204' ||
        (insertError as any)?.message?.includes('PGRST204') ||
        (insertError as any)?.message?.includes('Could not find');
      if (isPGRST204 && businessId) {
        console.warn('⚠️ business_id column not found in review_requests — retrying without it');
        const retry = await supabaseAdmin
          .from('review_requests')
          .insert({
            user_id: userId,
            customer_name: customerName,
            customer_phone: customerPhone,
            message_text: messageText,
            review_link: review_link,
            status: 'sent',
            sent_via: 'whatsapp',
            sent_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (retry.error) {
          console.error('Failed to insert review request (retry):', retry.error);
          return NextResponse.json({ error: 'Failed to save review request' }, { status: 500 });
        }
        reviewRequest = retry.data;
      } else {
        console.error('Failed to insert review request:', insertError);
        return NextResponse.json({ error: 'Failed to save review request' }, { status: 500 });
      }
    }

    // Try to send via Meta WhatsApp if configured
    let whatsappSent = false;
    if (process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const templateName = 'review_request'; // Meta template name
        
        // Normalize phone to E.164 format (+92XXXXXXXXXX) - required by Meta API
        const e164Phone = customerPhone.replace(/[^\\d+]/g, '').startsWith('+') 
          ? customerPhone.replace(/[^\\d+]/g, '') 
          : '+' + customerPhone.replace(/[^\\d+]/g, '');

        console.log(`🔄 Normalized customer phone to E.164: ${e164Phone}`);

        const components = [
          {
            type: "body" as const,
            parameters: [
              { type: "text" as const, text: customerName },
              { type: "text" as const, text: trader_name || 'Our Services' },
              { type: "text" as const, text: review_link },
            ]
          }
        ];

        await sendMetaTemplate({
          to: e164Phone,
          templateName,
          languageCode: "en",
          components,
        });
        whatsappSent = true;
        console.log(`✅ Review request sent via Meta WhatsApp template to ${customerName} at ${e164Phone}`);
      } catch (metaErr: any) {
        console.error('❌ Meta WhatsApp template send failed:', metaErr.message);
        console.error('   Phone was normalized to:', customerPhone?.replace(/[^\\d+]/g, '').startsWith('+') 
          ? customerPhone.replace(/[^\\d+]/g, '') 
          : '+' + customerPhone.replace(/[^\\d+]/g, ''));
      }
    } else {
      console.log('📝 Meta WhatsApp not configured — review request logged but not sent via WhatsApp');
    }

    return NextResponse.json({
      success: true,
      data: reviewRequest,
      whatsapp_sent: whatsappSent,
      message: whatsappSent
        ? 'Review request sent successfully!'
        : 'Review request logged. WhatsApp sending not configured.',
    });
  } catch (error: any) {
    console.error('send-request Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}