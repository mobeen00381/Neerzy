import { NextResponse } from "next/server";
import { TRIAL_DAYS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, userId, paymentMethodId } = body;

    // MOCK SUBSCRIPTION CREATION
    // Real implementation: Paddle API to create customer and start subscription with 90 day trial

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
    
    const currentPeriodEnd = new Date(trialEndsAt);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    return NextResponse.json({ 
      success: true, 
      subscription: {
        id: "sub_123",
        userId,
        planId,
        status: "trialing",
        trialEndsAt: trialEndsAt.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Mock fetching subscription status
  return NextResponse.json({ 
    subscription: {
      status: "trialing",
      daysLeft: 89,
      plan: "pro"
    }
  });
}
