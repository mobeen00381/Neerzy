import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { PRICING_PLANS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { planId, domainName, domainPrice, businessName, serviceType } = await req.json();

    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // In Paddle Billing, we create a Checkout Transaction or use a pre-defined Price ID
    // For this migration, we'll use the 'paddle.checkout.getCheckoutUrl' or similar
    // Note: You must have Price IDs for these plans in your Paddle Dashboard.
    
    const PADDLE_PRICE_IDS: Record<string, string> = {
      starter: "pri_starter_placeholder",
      pro: "pri_pro_placeholder",
      domain: "pri_domain_placeholder"
    };

    const priceId = PADDLE_PRICE_IDS[planId];
    if (!priceId) {
      return NextResponse.json({ error: "Paddle Price ID not found for this plan" }, { status: 400 });
    }

    // Create a transaction with Paddle
    // We pass custom data to the webhook
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
        // If there's a domain price, add it as a one-time charge
        {
          priceId: PADDLE_PRICE_IDS.domain,
          quantity: 1,
        }
      ],
      customData: {
        planId,
        domainName,
        businessName: businessName || "",
        serviceType: serviceType || "",
      },
    });

    // In Paddle Billing v3, checkouts are often handled via the Paddle.js library on the frontend
    // using the Transaction ID. However, if you need a hosted checkout URL:
    // Some SDK versions might expose it differently. 
    
    return NextResponse.json({ 
      transactionId: transaction.id,
      // For hosted checkout, we might need to construct the URL or use a different method
      // If the SDK transaction object has a checkout property:
      url: transaction.checkout?.url || "" 
    });
  } catch (error: any) {
    console.error("Paddle Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
