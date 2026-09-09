import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMetaText } from "@/lib/whatsapp";
import { RENEWAL_NOTICE_BEFORE_DAYS } from "@/lib/domain-registry";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * POST /api/cron/domain-renewals
 *
 * Scheduled daily (3:00 AM UTC, see vercel.json "crons").
 *
 * When a trader's domain enters the day-330 window (≤35 days before expiry,
 * RENEWAL_NOTICE_BEFORE_DAYS) a Neerzy WhatsApp heads-up is sent once:
 *
 *   "Your domain renews automatically on {date} — same $19 as registration.
 *    No surprise fees."
 *
 * Porkbun auto-renew is enabled at registration (`autoRenew: yes`), so the
 * renewal itself is fully automatic. This notice only prevents churn + builds
 * trust. `renewal_notified_at` is set after a successful send so a domain is
 * only ever notified once (and retried next run if the send fails).
 *
 * Vercel Cron protection: the request must carry either
 *   Authorization: Bearer {CRON_SECRET}   (Vercel standard)
 *   or X-Cron-Secret: {CRON_SECRET}
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
      console.warn("⚠️ CRON_SECRET not set — running domain-renewal cron unauthenticated (dev).");
    }

    const now = new Date();
    const windowEnd = new Date(now.getTime() + RENEWAL_NOTICE_BEFORE_DAYS * 24 * 60 * 60 * 1000);

    const { data: due, error: fetchErr } = await supabaseAdmin
      .from("domains")
      .select("id, user_id, domain_name, status, price_paid, expires_at, renewal_notified_at")
      .eq("status", "active")
      .eq("auto_renew", true)
      .is("renewal_notified_at", null)
      .gte("expires_at", now.toISOString())
      .lte("expires_at", windowEnd.toISOString())
      .limit(200);

    if (fetchErr) {
      console.error("❌ [Cron] Failed to fetch due domains:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    let notified = 0;
    let skippedNoPhone = 0;
    const failures: string[] = [];

    for (const domain of due || []) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("phone, business_name")
        .eq("id", domain.user_id)
        .maybeSingle();

      const phone = profile?.phone || "";
      if (!phone) {
        skippedNoPhone += 1;
        console.warn(`🔇 [Cron] Domain ${domain.domain_name}: owner has no phone on profile — retrying next run.`);
        continue;
      }

      const to = phone.replace(/\D/g, ""); // WhatsApp Cloud API wants digits, no "+"
      const price = domain.price_paid ?? 19;
      const expiryDate = domain.expires_at
        ? new Date(domain.expires_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "soon";

      const message =
        `🌐 *Domain renewal heads-up — ${domain.domain_name}*\n\n` +
        `Hi ${profile?.business_name || "there"}! Your domain *${domain.domain_name}* renews automatically on ${expiryDate}. 🔁\n\n` +
        `Renewal price: *$${price}* — the *same* as your registration. No surprise fees, nothing to do — your website stays live. 🚀`;

      try {
        await sendMetaText({ to, body: message });
        notified += 1;
        const { error: markErr } = await supabaseAdmin
          .from("domains")
          .update({ renewal_notified_at: new Date().toISOString() })
          .eq("id", domain.id);
        if (markErr) console.error(`⚠️ [Cron] Could not mark ${domain.domain_name} notified:`, markErr);
      } catch (err: any) {
        failures.push(domain.domain_name);
        console.error(`❌ [Cron] WhatsApp send failed for ${domain.domain_name}:`, err?.message || err);
        // Not marked → the next daily run retries automatically.
      }
    }

    console.log(`✅ [Cron] Domain renewals: ${notified} notified · ${skippedNoPhone} no-phone skipped · ${failures.length} failed`);
    return NextResponse.json({ ok: true, notified, skippedNoPhone, failures });
  } catch (err: any) {
    console.error("❌ [Cron] Unexpected error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Cron failed" }, { status: 500 });
  }
}
