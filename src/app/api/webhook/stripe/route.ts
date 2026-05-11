import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { registerDomain, addDomainToVercel } from "@/lib/domain-registry";
import { createClient } from "@supabase/supabase-js";

// Init server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
);

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle successful subscription
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;

    console.log("💰 Payment Successful for:", metadata.domainName);
    
    // 1. Register the Domain Programmatically
    await registerDomain(metadata.domainName);
    
    // 2. Add to Vercel project for live hosting + SSL
    await addDomainToVercel(metadata.domainName);
    
    // 3. Mark the subscription as active in your DB
    const customerEmail = session.customer_details?.email || "";
    const customerName = session.customer_details?.name || "";

    const { error } = await supabase.from("users").insert([
      {
        email: customerEmail,
        name: customerName,
        plan: metadata.planId,
        business_name: metadata.businessName,
        service_type: metadata.serviceType,
        domain: metadata.domainName,
      }
    ]);

    if (error) {
      console.error("❌ Failed to insert user into Supabase:", error);
    } else {
      console.log("✅ User inserted into Supabase:", customerEmail);
    }
    
    console.log("🚀 Business is now LIVE on:", metadata.domainName);
  }

  return NextResponse.json({ received: true });
}
