import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    // Try to get user from auth header or session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (user) {
      userId = user.id;
    } else {
      // Fallback: try to get from the request body
      const body = await req.json();
      userId = body.user_id || null;
      
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { to: customerPhone, review_link, trader_name, customer_name } = body;

    if (!customerPhone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
    }

    if (!review_link) {
      return NextResponse.json({ error: 'Review link is required' }, { status: 400 });
    }

    // Get user's plan for quota checking
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('selected_plan')
      .eq('id', userId)
      .maybeSingle();

    const planTier = profile?.selected_plan || 'free';
    const { PLAN_LIMITS } = await import('@/lib/plans');
    const planLimits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Check total review request quota
    const { count: totalSent, error: totalCountError } = await supabaseAdmin
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalCountError) {
      console.error('Error counting total review requests:', totalCountError);
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
      console.error('Error counting daily review requests:', dailyCountError);
    }

    if (dailySent !== null && planLimits.dailyReviewRequests !== -1 && dailySent >= planLimits.dailyReviewRequests) {
      return NextResponse.json({
        error: `Daily limit of ${planLimits.dailyReviewRequests} review requests reached. Try again tomorrow.`
      }, { status: 403 });
    }

    // Generate the WhatsApp message
    const customerName = customer_name || trader_name || 'Valued Customer';
    const messageText = `Hi ${customerName}! 👋\n\nThank you for choosing ${trader_name || 'our business'}! We'd really appreciate it if you could leave us a quick review. It helps us grow!\n\n🔗 Review link: ${review_link}`;

    // Get the business profile to link the request
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_phone', body.user_phone || '')
      .maybeSingle();

    // Insert the review request record
    const { data: reviewRequest, error: insertError } = await supabaseAdmin
      .from('review_requests')
      .insert({
        user_id: userId,
        business_id: businessProfile?.id || null,
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
      console.error('Failed to insert review request:', insertError);
      return NextResponse.json({ error: 'Failed to save review request' }, { status: 500 });
    }

    // Try to send via Twilio WhatsApp if configured
    let whatsappSent = false;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilioClient = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        const defaultFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+18338872999';
        
        // Try template first
        const templateSid = process.env.TWILIO_TEMPLATE_REVIEW_REQUEST || 'HX36dc564715671fad2b3617c795984ee2';
        const templateVars = {
          "1": customerName,
          "2": trader_name || 'Our Services',
          "3": review_link
        };

        await twilioClient.messages.create({
          from: defaultFrom,
          to: `whatsapp:${customerPhone.replace('whatsapp:', '')}`,
          contentSid: templateSid,
          contentVariables: JSON.stringify(templateVars)
        });
        whatsappSent = true;
        console.log(`✅ Review request sent via WhatsApp template to ${customerName} at ${customerPhone}`);
      } catch (twilioErr: any) {
        console.warn('⚠️ WhatsApp template send failed, trying SMS fallback:', twilioErr.message);
        
        // Fallback to SMS
        try {
          const twilioClient = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          );
          const smsFrom = (process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+18338872999').replace('whatsapp:', '');
          const smsTo = customerPhone.replace('whatsapp:', '');
          
          await twilioClient.messages.create({
            from: smsFrom,
            to: smsTo,
            body: messageText
          });
          whatsappSent = true;
          console.log(`✅ Review request sent via SMS fallback to ${customerName} at ${smsTo}`);
        } catch (smsErr: any) {
          console.error('❌ SMS fallback also failed:', smsErr.message);
        }
      }
    } else {
      console.log('📝 Twilio not configured — review request logged but not sent via WhatsApp');
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
