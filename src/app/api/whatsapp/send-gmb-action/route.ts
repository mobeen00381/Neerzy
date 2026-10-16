import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMetaText } from '@/lib/whatsapp';
import { chatWithFallback } from '@/lib/openai';
import { guardUserAction, GMB_ACTION_LIMIT } from '@/lib/api-guard';

/**
 * Generates a Google post / review request for the signed-in owner's business.
 *
 * Neerzy works fully with a Google or email login and NO WhatsApp number, so
 * this route always returns the generated text in the response body for the
 * page to display. WhatsApp delivery is an optional extra that only happens
 * when the owner has a phone stored on their own profile — a phone in the
 * request body is ignored, and no phone number is ever logged.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Longest generated post/review we will return, display or bill for. */
const MAX_MESSAGE_CHARS = 1200;

const TOO_MANY_ACTIONS =
  'You have generated a few of these in the last hour — please try again later.';

const NO_PHONE_MESSAGE =
  'Add your WhatsApp number in Account settings to receive this on WhatsApp.';

const GENERIC_ERROR = 'Could not generate that right now — please try again.';

type GmbAction = 'generate_post' | 'send_review';

/**
 * Server-side detail for logs. Deliberately never logs the request body or the
 * phone number (a Meta/axios error object can carry the request config).
 */
function logDetail(err: unknown): string {
  const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
  return e?.response?.data?.error?.message || e?.message || 'unknown error';
}

export async function POST(req: Request) {
  try {
    // 1. Session first: the token decides whose phone we may use.
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = authData.user;

    // 2. body.phoneNumber is intentionally ignored — the recipient can only be
    //    the phone saved on this user's own profile.
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const placeId = typeof body?.placeId === 'string' ? body.placeId : '';
    const action = typeof body?.action === 'string' ? body.action : '';

    if (!placeId || !action) {
      return NextResponse.json({ error: 'Missing placeId or action' }, { status: 400 });
    }
    if (action !== 'generate_post' && action !== 'send_review') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    // 3. Per-account limit before the paid LLM call.
    const guard = await guardUserAction(user.id, 'whatsapp:gmb-action', GMB_ACTION_LIMIT, TOO_MANY_ACTIONS);
    if (!guard.allowed) return guard.response;

    // 4. Fetch GMB data from the jobs table
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('gmb_place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job/GMB data not found' }, { status: 404 });
    }

    const businessName = job.gmb_business_name || 'your business';
    const city = job.gmb_address?.split(',').reverse()[2]?.trim() || 'your area';

    // 5. Generate the content with one LLM call, capped in length.
    const typedAction = action as GmbAction;
    const completion = await chatWithFallback({
      messages: [
        typedAction === 'generate_post'
          ? { role: 'system', content: 'You are a local SEO expert. Write a short, punchy social post for a business to share their recent success.' }
          : { role: 'system', content: 'You are a customer success manager. Write a polite message asking for a Google review.' },
        {
          role: 'user',
          content: typedAction === 'generate_post'
            ? `Write a post for ${businessName} in ${city}. They just completed a high-quality job. Keep it under 40 words and include relevant local hashtags.`
            : `Write a polite review request for ${businessName}. Mention that the customer's feedback helps other locals in ${city}. Keep it very friendly and short.`,
        },
      ],
    });

    const generatedMessage = (completion.choices[0].message.content || '').trim().slice(0, MAX_MESSAGE_CHARS);
    if (!generatedMessage) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    }

    // 6. WhatsApp is optional. The recipient is this user's own stored phone.
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();
    const meta = (user.user_metadata || {}) as Record<string, string>;
    const phone = user.phone || profileRow?.phone || meta.phone_number || meta.phone || null;

    if (!phone) {
      // Not a delivery failure: the web-only user still gets the generated text
      // on screen. We just tell them how to also get it on WhatsApp.
      await supabase.from('audit_logs').insert({
        action: `gmb_${typedAction}_generated`,
        meta: { placeId, businessName, message: generatedMessage, delivered: false },
      });

      return NextResponse.json(
        {
          success: false,
          requiresPhone: true,
          whatsappStatus: 'missing_phone',
          generatedMessage,
          action: typedAction,
          message: NO_PHONE_MESSAGE,
        },
        { status: 400 }
      );
    }

    let whatsappStatus: 'sent' | 'failed' = 'sent';
    let message = 'Your WhatsApp message is on its way.';

    const whatsappBody = `🚀 ${businessName} Update:\n\n${generatedMessage}\n\nCheck out our work: ${process.env.NEXT_PUBLIC_APP_URL}/showcase/${placeId}`;
    try {
      await sendMetaText({ to: phone, body: whatsappBody });
    } catch (err) {
      whatsappStatus = 'failed';
      message = 'Generated — we could not reach WhatsApp just now.';
      console.error('[send-gmb-action] WhatsApp delivery failed:', logDetail(err));
    }

    await supabase.from('audit_logs').insert({
      action: `whatsapp_${typedAction}`,
      meta: { placeId, businessName, message: generatedMessage, delivered: whatsappStatus === 'sent' },
    });

    return NextResponse.json({
      success: true,
      whatsappStatus,
      generatedMessage,
      action: typedAction,
      message,
    });
  } catch (error) {
    console.error('[send-gmb-action] failed:', logDetail(error));
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
