import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { PRICING_PLANS } from "@/lib/constants";

export async function POST(req: Request) {
  let planId = "pro"; // Default fallback
  try {
    const body = await req.json();
    planId = body.planId;
    const { domainName, businessName, serviceType } = body;

    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const PADDLE_PRICE_IDS: Record<string, string> = {
      pro: process.env.PADDLE_PRO_PRICE_ID || "pri_01kqw4dy15ptkzs43bm3pqr12w",
      growth: process.env.PADDLE_GROWTH_PRICE_ID || "pri_01kqw4j2820525t8q9yhk21x7n",
      agency: process.env.PADDLE_AGENCY_PRICE_ID || "pri_01kqw4mmbwxgjvt5pc0cf5b80h",
      domain: process.env.PADDLE_DOMAIN_PRICE_ID || "pri_01kpqrc7ths0fz8synqzhhasd9"
    };

    const priceId = PADDLE_PRICE_IDS[planId];
    if (!priceId) {
      return NextResponse.json({ error: "Paddle Price ID not found for this plan" }, { status: 400 });
    }

    // Build items array — only include domain if domainName is provided
    const items: { priceId: string; quantity: number }[] = [
      { priceId: priceId, quantity: 1 }
    ];

    if (domainName) {
      items.push({ priceId: PADDLE_PRICE_IDS.domain, quantity: 1 });
    }

    // Create a transaction with Paddle
    const transaction = await paddle.transactions.create({
      items,
      customData: {
        planId,
        domainName: domainName || "",
        businessName: businessName || "",
        serviceType: serviceType || "",
      },
    });

    return NextResponse.json({ 
      transactionId: transaction.id,
      url: transaction.checkout?.url || "" 
    });
  } catch (error: any) {
    console.error("Paddle Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}

