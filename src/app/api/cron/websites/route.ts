import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMetaText } from "@/lib/whatsapp";
import { HOSTING_NOTICE_DAYS_BEFORE, HOSTING_PRICE_USD, hostingDaysLeft } from "@/lib/website";
import { buildWebsite } from "@/lib/website-builder";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * POST /api/cron/websites
 *
 * Scheduled daily (see vercel.json "crons").
 *
 * Early-adopter websites get 90 days of free hosting. This job:
 *   1) 7 days before the free window ends → sends one WhatsApp notice:
 *        "hosting starts {date} — $10/month".
 *   2) when the free window ends and hosting is still unpaid → the website is
 *      paused and the trader gets one "reactivate for $10/mo" notice.
 *
 * Latecomers pay up-front, so they never enter this job.
 *
 * Protection: Authorization: Bearer {CRON_SECRET} or X-Cron-Secret header.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET || "";
    if (secret) {
      const bearer = (req.headers.get("authorization") || "").replace("Bearer ", "");
      const headerSecret = req.headers.get("x-cron-secret") || "";
      if (bearer !== secret && headerSecret !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("⚠️ CRON_SECRET not set — running website cron unauthenticated (dev).");
    }

    const { data: trials, error: fetchErr } = await supabaseAdmin
      .from("websites")
      .select("id, user_id, domain_name, status, hosting_status, free_until, notice_sent_at, pause_notice_sent_at")
      .eq("hosting_status", "trial")
      .in("status", ["building", "live"])
      .not("free_until", "is", null)
      .limit(200);

    if (fetchErr) {
      console.error("❌ [Cron] Failed to fetch website trials:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    let noticed = 0;
    let paused = 0;
    let skippedNoPhone = 0;
    const failures: string[] = [];

    for (const site of trials || []) {
      const daysLeft = hostingDaysLeft(site.free_until);

      // still far from expiry → nothing to do
      if (daysLeft === null) continue;
      const inNoticeWindow = daysLeft >= 0 && daysLeft <= HOSTING_NOTICE_DAYS_BEFORE;
      const expired = daysLeft < 0;

      if (!expired && !inNoticeWindow) continue;
      if (expired && site.pause_notice_sent_at) continue;
      if (!expired && site.notice_sent_at) continue;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("phone, business_name")
        .eq("id", site.user_id)
        .maybeSingle();

      const phone = profile?.phone || "";
      if (!phone) {
        skippedNoPhone += 1;
        console.warn(`🔇 [Cron] Website ${site.domain_name}: owner has no phone — retrying next run.`);
        continue;
      }

      const to = phone.replace(/\D/g, "");
      const siteName = site.domain_name || "your website";
      const expiryDate = site.free_until
        ? new Date(site.free_until).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "soon";

      const message = expired
        ? `⏸️ *Your website is paused — ${siteName}*\n\n` +
          `Your free hosting period ended on ${expiryDate}. Reactivate hosting for just *$${HOSTING_PRICE_USD}/month* ` +
          `from your Neerzy dashboard → Account → Website. Your site and content are saved — nothing is lost. 🌐`
        : `🌐 *Hosting starts soon — ${siteName}*\n\n` +
          `Hi ${profile?.business_name || "there"}! Your free website hosting ends on ${expiryDate}. ` +
          `After that, hosting is just *$${HOSTING_PRICE_USD}/month* — you can set it up from your dashboard → Account → Website. ` +
          `Your $99 setup fee stays waived as an early adopter. 🎉`;

      try {
        await sendMetaText({ to, body: message });

        if (expired) {
          paused += 1;
          await supabaseAdmin
            .from("websites")
            .update({
              status: "paused",
              pause_notice_sent_at: new Date().toISOString(),
            })
            .eq("id", site.id);
        } else {
          noticed += 1;
          await supabaseAdmin
            .from("websites")
            .update({ notice_sent_at: new Date().toISOString() })
            .eq("id", site.id);
        }
      } catch (err: any) {
        failures.push(site.domain_name || site.id);
        console.error(`❌ [Cron] Website notice failed for ${siteName}:`, err?.message || err);
        // Not marked → next daily run retries.
      }
    }

    console.log(`✅ [Cron] Websites: ${noticed} hosting notices · ${paused} paused · ${skippedNoPhone} no-phone skipped · ${failures.length} failed`);

    // ── Safety net: finish builds that got stuck (e.g. a function timeout) ──
    let rebuilt = 0;
    const rebuiltFailures: string[] = [];
    try {
      const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: stuck } = await supabaseAdmin
        .from("websites")
        .select("id, domain_name, build_started_at")
        .eq("status", "building")
        .eq("preview_ready", false)
        .lt("build_started_at", staleBefore)
        .limit(20);

      for (const s of stuck || []) {
        const res = await buildWebsite(s.id);
        if (res.ok) rebuilt += 1;
        else rebuiltFailures.push(s.domain_name || s.id);
      }
      if ((stuck || []).length) {
        console.log(`🔁 [Cron] Rebuilt ${rebuilt} stuck website(s)`);
      }
    } catch (rebuildErr: any) {
      console.error("❌ [Cron] Stuck-build retry failed:", rebuildErr?.message || rebuildErr);
    }

    return NextResponse.json({
      ok: true,
      noticed,
      paused,
      skippedNoPhone,
      failures,
      rebuilt,
      rebuiltFailures,
    });
  } catch (err: any) {
    console.error("❌ [Cron] Website cron unexpected error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Cron failed" }, { status: 500 });
  }
}
