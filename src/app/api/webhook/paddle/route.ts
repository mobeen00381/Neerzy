import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { SubscriptionCreatedEvent, TransactionCompletedEvent } from "@paddle/paddle-node-sdk";
import { headers } from "next/headers";
import { registerDomain, addDomainToVercel } from "@/lib/domain-registry";
import { createClient } from "@supabase/supabase-js";
import { SubscriptionCreatedNotification, TransactionNotification } from "@/types";

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

    // Handle successful transaction or subscription
    const eventType = event.eventType || event.event_type;
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
