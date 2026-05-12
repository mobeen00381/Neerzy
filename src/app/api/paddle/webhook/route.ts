import { NextResponse } from 'next/server';
import { paddle } from '@/lib/paddle';
import { SubscriptionActivatedEvent, SubscriptionUpdatedEvent } from '@paddle/paddle-node-sdk';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('paddle-signature') || '';
    const rawBody = await req.text();
    
    // Verify signature using the official SDK (prevents spoofing)
    const event = await paddle.webhooks.unmarshal(
      rawBody, 
      process.env.PADDLE_WEBHOOK_SECRET!, 
      signature
    );
    
    console.log(`🔔 Paddle Webhook: ${event.eventType}`);

    // Handle critical subscription events
    switch (event.eventType) {
      case 'subscription.activated':
      case 'subscription.updated':
        console.log(`✅ Syncing trader subscription: ${event.data.id}`);
        // await syncTraderSubscription(event.data);
        break;
      case 'subscription.canceled':
        console.log(`❌ Deactivating access for user: ${event.data.customerId}`);
        // await deactivateTraderAccess(event.data.customerId);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Paddle webhook error:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
