import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMetaText } from '@/lib/whatsapp';
import { generateSocialContent } from '@/lib/social-content';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Social Content API — Growth/Agency plan feature.
//
// Actions (POST body.action):
//   'generate'  → AI writes a Facebook post + Instagram caption from job details.
//   'last_job'  → Returns the trader's most recent WhatsApp job description
//                 (used by the dashboard "Use my last job" button).
//   'send'      → Delivers the generated Facebook + Instagram posts straight to
//                 the trader's own WhatsApp (phone-first, non-technical users).
//
// Security: every action requires a logged-in Supabase user (Bearer token) AND
// a growth/agency plan (server-side — not just UI gating).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// DB-backed rate limiter (same pattern as posts/create — safe for serverless)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ENDPOINT = 'social-content';

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; resetAt: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  try {
    void supabaseAdmin
      .from('rate_limits')
      .delete()
      .lt('created_at', new Date(now.getTime() - 3600_000).toISOString());

    const { data: existing } = await supabaseAdmin
      .from('rate_limits')
      .select('id, request_count, window_start')
      .eq('ip_address', ip)
      .eq('endpoint', ENDPOINT)
      .gt('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('rate_limits').insert({
        ip_address: ip,
        endpoint: ENDPOINT,
        request_count: 1,
        window_start: now.toISOString(),
      });
      return { allowed: true, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
    }

    if (existing.request_count >= RATE_LIMIT_MAX) {
      return { allowed: false, resetAt: new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW_MS };
    }

    await supabaseAdmin
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);

    return { allowed: true, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
  } catch (err) {
    console.error('Rate limiter DB error (failing closed):', err);
    return { allowed: false, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
  }
}

/** "Use my last job" — newest WhatsApp job description belonging to this user. */
async function fetchLastJob(userId: string, phone: string | null) {
  let query = supabaseAdmin
    .from('pending_posts')
    .select('voice_note, google_post, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq('user_id', userId) as typeof query;
  } else if (phone) {
    query = query.eq('user_phone', phone) as typeof query;
  } else {
    return null;
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;

  // Prefer the raw job description (voice note / text). Fall back to the
  // generated Google post so the button still fills something useful.
  const description = (data.voice_note || '').toString().trim();
  const googlePost = (data.google_post || '').toString().trim();
  const text = description || googlePost || '';
  if (!text) return null;

  return {
    // Keep it short — enough context for the AI, not a wall of text.
    jobTopic: text.length > 600 ? `${text.slice(0, 600)}…` : text,
  };
}

function buildWhatsAppBlocks(content: any) {
  const fbText = `${(content?.facebook?.postText || '').trim()}\n\n${(content?.facebook?.hashtags || '').trim()}`.trim();
  const igText = `${(content?.instagram?.caption || '').trim()}\n\n${(content?.instagram?.hashtags || '').trim()}`.trim();

  const fbMessage = `📣 *From your Neerzy Dashboard*\n\n✅ *Post 2 of 3 — FACEBOOK*\nCopy the text below:\n\n${fbText}\n\n📌 *Steps:* copy above → open Facebook → paste → tap Post.`;
  const igMessage = `📣 *From your Neerzy Dashboard*\n\n✅ *Post 3 of 3 — INSTAGRAM*\nCopy the caption below:\n\n${igText}\n\n📌 *Steps:* copy above → open Instagram → paste → tap Post.`;

  const combinedFallback = `My Neerzy social posts 🛠️\n\nFACEBOOK:\n${fbText}\n\nINSTAGRAM:\n${igText}`;

  return { fbMessage, igMessage, combinedFallback };
}

export async function POST(req: Request) {
  try {
    // Rate limiting (per IP)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';
    const rateCheck = await checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Auth — require a real Supabase session (no body fallback for AI endpoints)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Profile + plan (server-side gating for growth/agency)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('selected_plan, phone')
      .eq('id', user.id)
      .maybeSingle();

    const planTier = (profile?.selected_plan || 'free').toLowerCase();
    if (planTier !== 'growth' && planTier !== 'agency') {
      return NextResponse.json(
        { error: 'This feature is part of the Growth plan. Upgrade to generate Facebook & Instagram content.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body?.action || 'generate';

    // ── Action: generate ──
    if (action === 'generate') {
      const { jobTopic, contentType, businessName, businessCategory } = body;
      if (!jobTopic || !String(jobTopic).trim()) {
        return NextResponse.json({ error: 'Tell us about the job first' }, { status: 400 });
      }
      const result = await generateSocialContent({
        jobTopic: String(jobTopic).slice(0, 1500),
        contentType: String(contentType || 'showcase'),
        businessName: String(businessName || 'My Business').slice(0, 120),
        businessCategory: String(businessCategory || 'Local Service').slice(0, 120),
      });
      return NextResponse.json(result);
    }

    // ── Action: last_job ──
    if (action === 'last_job') {
      const lastJob = await fetchLastJob(user.id, profile?.phone || null);
      if (!lastJob) {
        return NextResponse.json({ jobTopic: '', hasLastJob: false });
      }
      return NextResponse.json({ jobTopic: lastJob.jobTopic, hasLastJob: true });
    }

    // ── Action: send (to the trader's own WhatsApp) ──
    if (action === 'send') {
      const phone = (profile?.phone || '').replace(/\s+/g, '');
      if (!phone) {
        return NextResponse.json({ error: 'No WhatsApp number linked to your account yet. Connect it from the dashboard, then try again.' }, { status: 400 });
      }

      const { fbMessage, igMessage, combinedFallback } = buildWhatsAppBlocks(body?.content);
      if (!fbMessage.includes('FACEBOOK') && !igMessage.includes('INSTAGRAM')) {
        return NextResponse.json({ error: 'Generate your posts first' }, { status: 400 });
      }

      let delivered = 0;
      let lastError = '';
      for (const message of [fbMessage, igMessage]) {
        if (!message.trim()) continue;
        try {
          await sendMetaText({ to: phone, body: message });
          delivered += 1;
        } catch (err: any) {
          lastError = err?.message || String(err);
          console.warn(`⚠️ WhatsApp self-delivery failed: ${lastError}`);
        }
      }

      if (delivered > 0) {
        return NextResponse.json({ sent: true, delivered });
      }

      // Fallback: wa.me self-chat link with both posts pre-filled (no API needed)
      const digits = phone.replace(/\D/g, '');
      const fallbackLink = `https://wa.me/${digits}?text=${encodeURIComponent(combinedFallback)}`;
      console.warn(`⚠️ Social content fallback wa.me link generated (reason: ${lastError})`);
      return NextResponse.json({ sent: false, fallbackLink });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('❌ social-content API error:', err?.message || err);
    const message = err?.message || 'Something went wrong. Please try again.';
    const needs502 = /JSON|missing required|contained no JSON/i.test(message);
    return NextResponse.json({ error: message }, { status: needs502 ? 502 : 500 });
  }
}

