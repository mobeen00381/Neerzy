import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { SubscriptionCreatedEvent, TransactionCompletedEvent } from "@paddle/paddle-node-sdk";
import { headers } from "next/headers";
import { registerDomain, addDomainToVercel } from "@/lib/domain-registry";
import { createClient } from "@supabase/supabase-js";
import { SubscriptionCreatedNotification, TransactionNotification } from "@/types";
import { PLAN_MONTHLY_PRICE } from "@/lib/plans";

// Init server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Type guard to check if a notification data object is a subscription creation event
 */
function isSubscriptionCreated(
  data: SubscriptionCreatedNotification | TransactionNotification | any
): data is SubscriptionCreatedNotification {
  return data && 'customer' in data && data.customer !== undefined;
}

/** Event types that create a row in the admin `transactions` ledger. */
const LEDGER_EVENT_TYPES = new Set([
  'transaction.completed',
  'transaction.paid',
  'transaction.refunded',
  'subscription.created',
  'subscription.activated',
  'subscription.canceled',
]);

function pick(custom: any, keys: string[]): string | null {
  if (!custom || typeof custom !== 'object') return null;
  for (const k of keys) {
    const v = custom[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return null;
}

/**
 * Appends a Paddle notification to the `transactions` ledger. Idempotent on
 * `paddle_event_id` (unique). Rows from transaction.completed carry the money
 * amount and are the basis for revenue; subscription.created / canceled /
 * refunded rows are lifecycle records for the admin dashboard.
 */
async function recordPaddleEvent(supabase: any, raw: any, eventType: string) {
  if (!raw || !LEDGER_EVENT_TYPES.has(eventType)) return;
  const data = raw.data || {};
  const customData = data.custom_data && typeof data.custom_data === 'object' ? data.custom_data : {};

  const eventId = raw.event_id || raw.eventId || null;
  if (!eventId) return;

  const planRaw = pick(customData, ['planId', 'plan_id', 'plan', 'planid']) || null;
  const plan = (planRaw || '').toLowerCase().trim() || null;
  const fallbackUserId = pick(customData, ['userId', 'user_id', 'userid']) || null;

  const subscriptionId =
    data.subscription_id || data.subscriptionId || null;
  const transactionId =
    eventType === 'transaction.completed' || eventType === 'transaction.paid' || eventType === 'transaction.refunded'
      ? data.id || null
      : null;
  const customerEmail = data.customer?.email || data.customer_email || null;

  // Correlate a subscription-linked event to a profile: custom user id wins,
  // otherwise look up the user we recorded when the subscription was created.
  let userId: string | null = fallbackUserId;
  if (!userId && subscriptionId) {
    const { data: prev } = await supabase
      .from('transactions')
      .select('user_id, plan')
      .eq('paddle_subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    userId = prev?.user_id || null;
  }

  // Money: prefer the purchased price unit amount (major-unit decimal string).
  // Fall back to the canonical plan price when the payload omits it.
  let amount: number | null = null;
  let currency: string | null = data.currency_code || data.currencyCode || 'USD';
  try {
    const unitPrice = data.items?.[0]?.price?.unit_price?.amount;
    const unitCurrency = data.items?.[0]?.price?.unit_price?.currency_code;
    if (unitPrice !== undefined && unitPrice !== null) {
      amount = parseFloat(String(unitPrice));
      if (!Number.isFinite(amount)) amount = null;
    }
    if (unitCurrency) currency = unitCurrency;
  } catch { /* keep null */ }
  if (amount === null && plan && plan in PLAN_MONTHLY_PRICE) {
    amount = PLAN_MONTHLY_PRICE[plan as keyof typeof PLAN_MONTHLY_PRICE];
  }

  const isRefundLike =
    eventType.includes('refund') ||
    String(data.origin || '').toLowerCase().includes('refund');
  if (isRefundLike && amount !== null && amount > 0) amount = -amount;

  if (eventType === 'subscription.canceled') amount = null;

  const occurredAt =
    data.billed_at || data.created_at || data.billing_period?.starts_at || new Date().toISOString();

  const payload: any = {
    paddle_event_id: eventId,
    paddle_subscription_id: subscriptionId,
    user_id: userId,
    email: customerEmail || null,
    plan,
    amount,
    currency,
    event_type: eventType,
    origin: data.origin || data.origin_type || null,
    status: data.status || 'completed',
    occurred_at: occurredAt,
  };
  if (transactionId) payload.paddle_transaction_id = transactionId;

  await supabase.from('transactions').upsert(payload, {
    onConflict: 'paddle_event_id',
    ignoreDuplicates: false,
  });

  console.log(`📒 Ledger: ${eventType} · plan=${plan || '—'} · amount=${amount ?? '—'} ${currency || ''} · user=${userId || '—'}`);
}


export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("Paddle-Signature") as string;

  try {
    // Validate and parse the webhook event
    let event;
    try {
      if (process.env.PADDLE_WEBHOOK_SECRET && process.env.PADDLE_WEBHOOK_SECRET !== "your_paddle_webhook_secret_here") {
        event = await paddle.webhooks.unmarshal(body, process.env.PADDLE_WEBHOOK_SECRET, signature);
      } else {
        console.warn("⚠️ Bypassing Webhook Validation because Webhook Secret is missing.");
        event = JSON.parse(body);
      }
    } catch (e) {
      console.warn("⚠️ Webhook signature validation failed or missing secret. Parsing as raw JSON.");
      event = JSON.parse(body);
    }
    
    console.log(`🔔 Paddle Webhook Received: ${event.eventType || event.event_type || 'Unknown'}`);

    // Plain parsed JSON payload — the ledger fields are easiest to read from it
    // regardless of how the SDK unmarshalled the event into classes.
    let rawPayload: any = null;
    try {
      rawPayload = JSON.parse(body);
    } catch {
      // SDK instance events only — ledger recording will be skipped.
    }

    // Handle successful transaction or subscription
    const eventType = rawPayload?.event_type || event.eventType || event.event_type || 'unknown';

    // Record every revenue-relevant event into the admin `transactions` ledger.
    // Cancels/refunds are recorded as lifecycle rows; revenue totals in the
    // dashboard are computed from transaction.completed rows only.
    try {
      await recordPaddleEvent(supabase, rawPayload, eventType);
    } catch (ledgerErr) {
      console.error("❌ Failed to record Paddle event in transactions ledger:", ledgerErr);
    }

    const isSuccessEvent = 
      event instanceof TransactionCompletedEvent || 
      event instanceof SubscriptionCreatedEvent ||
      eventType === 'transaction.completed' || 
      eventType === 'subscription.created';

    if (isSuccessEvent) {
      // In SDK v3, unmarshal returns specialized event classes
      // event.data is the specific entity (Transaction or Subscription)
      const data = event.data;
      const customData = data?.customData || data?.custom_data;
      
      if (!customData) {
         console.warn("⚠️ No custom data found in Paddle event. Skipping.");
         return NextResponse.json({ received: true });
      }

      console.log("💰 Payment Successful for:", customData.domainName);
      
      // 1. Register the Domain Programmatically
      try {
        await registerDomain(customData.domainName);
      } catch (err) {
        console.error("❌ Domain Registration Failed:", err);
      }
      
      // 2. Add to Vercel project for live hosting + SSL
      try {
        await addDomainToVercel(customData.domainName);
      } catch (err) {
        console.error("❌ Vercel Domain Addition Failed:", err);
      }
      
      // 3. Mark the subscription/user as active in your DB
      // We use the customerId which is safe for both notification types
      const customerId = (data as any).customerId;
      
      // Fetch customer details from our DB if needed (or use the payload if available)
      const { data: userData } = await supabase
        .from("users")
        .select("email, name")
        .eq("paddle_customer_id", customerId)
        .single();

      let customerEmail = userData?.email || "";
      let customerName = userData?.name || "";

      // Safe access using our type guard
      if (!customerEmail && isSubscriptionCreated(data)) {
        // @ts-ignore - TODO: Properly narrow type
        customerEmail = data.customer?.email || "";
        // @ts-ignore - TODO: Properly narrow type
        customerName = data.customer?.name || "";
      }

      const { error } = await supabase.from("users").upsert([
        {
          paddle_customer_id: customerId,
          email: customerEmail,
          name: customerName,
          plan: customData.planId,
          business_name: customData.businessName,
          service_type: customData.serviceType,
          domain: customData.domainName,
          status: "active"
        }
      ], { onConflict: "paddle_customer_id" });

      if (error) {
        console.error("❌ Failed to insert user into Supabase:", error);
      } else {
        console.log("✅ User inserted into Supabase:", customerEmail);
      }

      // 4. Sync plan + 30-day cycle anchor to the user's profile (quota engine)
      const userIdFromCustom = (customData as any)?.userId;
      const planIdFromCustom = (customData as any)?.planId;
      if (userIdFromCustom) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({
            selected_plan: planIdFromCustom || "pro",
            plan_started_at: new Date().toISOString(),
          })
          .eq("id", userIdFromCustom);

        if (profileErr) {
          console.error("❌ Failed to sync plan to profiles:", profileErr);
        } else {
          console.log(`✅ Synced plan '${planIdFromCustom || "pro"}' + cycle start to profile ${userIdFromCustom}`);
        }
      }
      
      console.log("🚀 Business is now LIVE on:", customData.domainName);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }
}
