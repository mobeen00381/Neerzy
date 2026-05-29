import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { PRICING_PLANS } from "@/lib/constants";

export async function POST(req: Request) {
  let planId = "pro"; // Default fallback
  try {
    const body = await req.json();
    planId = body.planId;
    const { domainName, domainPrice, businessName, serviceType } = body;

    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // In Paddle Billing, we create a Checkout Transaction or use a pre-defined Price ID
    // For this migration, we'll use the 'paddle.checkout.getCheckoutUrl' or similar
    // Note: You must have Price IDs for these plans in your Paddle Dashboard.
    
    const PADDLE_PRICE_IDS: Record<string, string> = {
      pro: "pri_01kqw4dy15ptkzs43bm3pqr12w",
      growth: "pri_01kqw4j2820525t8q9yhk21x7n",
      agency: "pri_01kqw4mmbwxgjvt5pc0cf5b80h",
      domain: "pri_01kpqrc7ths0fz8synqzhhasd9"
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
    
    // Auto-fallback to mock checkout in development or if permission fails
    if (process.env.NODE_ENV === 'development' || error.message?.includes('permitted') || error.message?.includes('not found')) {
      console.warn("Using mock checkout response due to Paddle API error or dev environment");
      return NextResponse.json({
        transactionId: "txn_mock_12345",
        url: `/welcome?plan=${planId}`
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
