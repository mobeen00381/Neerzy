import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { headers } from "next/headers";
import { registerDomain, addDomainToVercel } from "@/lib/domain-registry";
import { createClient } from "@supabase/supabase-js";

// Init server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("Paddle-Signature") as string;

  try {
    // Validate the webhook signature
    const isValid = paddle.webhooks.verify(body, process.env.PADDLE_WEBHOOK_SECRET || "", signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(`🔔 Paddle Webhook Received: ${event.event_type}`);

    // Handle successful transaction (Checkout Completed)
    if (event.event_type === "transaction.completed" || event.event_type === "subscription.created") {
      const customData = event.data.custom_data;
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
      
      // 3. Mark the subscription as active in your DB
      const customerEmail = event.data.customer?.email || "";
      const customerName = event.data.customer?.name || "";

      const { error } = await supabase.from("users").insert([
        {
          email: customerEmail,
          name: customerName,
          plan: customData.planId,
          business_name: customData.businessName,
          service_type: customData.serviceType,
          domain: customData.domainName,
        }
      ]);

      if (error) {
        console.error("❌ Failed to insert user into Supabase:", error);
      } else {
        console.log("✅ User inserted into Supabase:", customerEmail);
      }
      
      console.log("🚀 Business is now LIVE on:", customData.domainName);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }
}
