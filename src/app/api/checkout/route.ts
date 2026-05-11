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

    // Create a checkout session with Paddle
    // We pass custom data to the webhook
    const checkout = await paddle.checkout.create({
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
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error("Paddle Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
