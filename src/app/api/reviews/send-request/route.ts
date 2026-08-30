import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, getCycleStartIso } from '@/lib/plans';
import { sendMetaTemplate, sendMetaText } from '@/lib/whatsapp';

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
      .select('selected_plan, phone, plan_started_at, trial_started_at, created_at')
      .eq('id', userId)
      .maybeSingle();

    const planTier = profile?.selected_plan || 'free';
    const planLimits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    const cycleStartIso = getCycleStartIso(profile?.plan_started_at || profile?.trial_started_at || profile?.created_at);

    // Check total review request quota for the current 30-day cycle
    const { count: totalSent, error: totalCountError } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', cycleStartIso);

    if (totalCountError) {
      console.error('Error counting total review requests:', totalCountError.message || totalCountError);
    }

    if (totalSent !== null && planLimits.totalReviewRequests !== -1 && totalSent >= planLimits.totalReviewRequests) {
      return NextResponse.json({
        error: `You've reached your plan limit of ${planLimits.totalReviewRequests} review requests per month. Upgrade to send more.`
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

    // Insert with enhanced logging for debugging
    console.log(`📝 Attempting review_requests insert for user ${userId}`);
    console.log(`   Data: user_id=${userId}, business_id=${businessId}, customer_name=${customerName}`);
    
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

    if (insertError) {
      console.error('❌ Insert failed:', JSON.stringify(insertError, null, 2));
      
      const isPGRST204 = (insertError as any)?.code === 'PGRST204' ||
        (insertError as any)?.message?.includes('PGRST204') ||
        (insertError as any)?.message?.includes('Could not find');
        
      // Retry without business_id if it's null/missing or column doesn't exist
      if (isPGRST204 || !businessId) {
        console.warn('⚠️ Retrying insert without business_id...');
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
          console.error('❌ Retry also failed:', JSON.stringify(retry.error, null, 2));
          // Return full error details for debugging
          return NextResponse.json({ 
            error: 'Failed to save review request',
            details: JSON.stringify(retry.error, null, 2),
            partial_data: { userId, customerName, customerPhone }
          }, { status: 500 });
        }
        reviewRequest = retry.data;
        console.log('✅ Retry succeeded');
      } else {
        return NextResponse.json({ 
          error: 'Database insert failed', 
          details: JSON.stringify(insertError, null, 2) 
        }, { status: 500 });
      }
    }

    // Try to send via Meta WhatsApp if configured
    let whatsappSent = false;
    if (process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
      // Normalize phone to E.164 format (+92XXXXXXXXXX) - required by Meta API
      const e164Phone = customerPhone.replace(/[^\d+]/g, '').startsWith('+')
        ? customerPhone.replace(/[^\d+]/g, '')
        : '+' + customerPhone.replace(/[^\d+]/g, '');

      console.log(`🔄 Attempting WhatsApp message to ${customerName} at ${e164Phone}`);

      try {
        const templateName = process.env.META_TEMPLATE_REVIEW_REQUEST || 'review_request'; // Meta template name

        // Step 1: Try approved template first
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

        const result = await sendMetaTemplate({
          to: e164Phone,
          templateName,
          languageCode: "en_US",
          components,
        });
        whatsappSent = true;
        console.log(`✅ Review request sent via Meta WhatsApp TEMPLATE to ${customerName} at ${e164Phone}, Message ID: ${result.messages?.[0]?.id}`);
        
        // Update record to reflect success
        if (reviewRequest?.id) {
          await supabaseAdmin.from('review_requests').update({
            status: 'sent',
            sent_via: 'whatsapp_template',
            sent_at: new Date().toISOString()
          }).eq('id', reviewRequest.id);
        }

      } catch (templateError: any) {
        console.error('❌ Template send failed:', templateError.message);
        console.error('   This usually means the template is not approved yet or does not exist in Meta Business Manager.');
        console.error('   Error details:', JSON.stringify(templateError, null, 2));
        
        // Step 2: FALLBACK - Send free-form text message (works within 24h conversation window)
        console.log('📩 FALLBACK: Sending free-form WhatsApp message...');
        try {
          const fallbackText = `Hi ${customerName}! 👋\n\nThank you for choosing ${trader_name || 'our services'}! We'd really appreciate it if you could leave us a quick review.\n\n🔗 Review link: ${review_link}\n\nIt helps us grow! 🙏`;
          
          const fallbackResult = await sendMetaText({ 
            to: e164Phone, 
            body: fallbackText 
          });
          
          whatsappSent = true;
          console.log(`✅ FALLBACK MESSAGE SENT successfully! Message ID: ${fallbackResult.messages?.[0]?.id}`);
          console.log(`💡 Note: Free-form messages work when customers have contacted you within the last 24 hours.`);
          
          // Update record to reflect success
          if (reviewRequest?.id) {
            await supabaseAdmin.from('review_requests').update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              sent_via: 'whatsapp_fallback'
            }).eq('id', reviewRequest.id);
          }
        } catch (fallbackError: any) {
          console.error('❌ Fallback message also failed:', fallbackError.message);
          console.error('   Both template and fallback delivery attempts failed.');
          // Don't throw - we still want to save the record to Supabase
        }
      }
    } else {
      console.log('📝 Meta WhatsApp not configured — review request logged but not sent via WhatsApp');
      console.log('   Set META_WHATSAPP_ACCESS_TOKEN, META_TEMPLATE_REVIEW_REQUEST, and META_WHATSAPP_PHONE_NUMBER_ID env vars.');
    }

    // If Meta WhatsApp could not deliver, record the request as needing a manual
    // fallback (device link) so history/analytics reflect what actually happened.
    if (!whatsappSent && reviewRequest?.id) {
      await supabaseAdmin.from('review_requests').update({
        status: 'manual_fallback',
        sent_via: 'manual_link',
      }).eq('id', reviewRequest.id);
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
