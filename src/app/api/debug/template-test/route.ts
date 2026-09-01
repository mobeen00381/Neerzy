// app/api/debug/template-test/route.ts - Test WhatsApp delivery (template OR free-form)
import { sendMetaTemplate, sendMetaText } from '@/lib/whatsapp';

export async function POST(request: Request) {
  const { phoneNumber, testName } = await request.json();
  
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = clean.startsWith('+') ? clean : `+${clean}`;

  try {
    if (testName === 'fallback') {
      // Test free-form message (works within 24h window)
      console.log('📩 Testing FALLBACK message delivery...');
      const result = await sendMetaText({ 
        to: e164, 
        body: '🧪 Neerzy Test Message\n\nThis is a test of your WhatsApp API connection. If you receive this, your fallback messaging works!\n\nhttps://neerzy.com' 
      });
      
      return Response.json({ 
        success: true, 
        messageId: result.messages?.[0]?.id, 
        to: e164,
        method: 'free-form_fallback',
        raw: result 
      });
    } else {
      // Test approved template
      const result = await sendMetaTemplate({
        to: e164,
        templateName: process.env.META_TEMPLATE_REVIEW_REQUEST || 'review_request',
        languageCode: 'en',
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: 'Test Customer' },
            { type: 'text', text: 'Neerzy' },
            { type: 'text', text: 'https://neerzy.com/r/test-review-link' },
          ]
        }],
      });
      
      return Response.json({ 
        success: true, 
        messageId: result.messages?.[0]?.id, 
        to: e164,
        method: 'approved_template',
        raw: result 
      });
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    // Provide helpful debugging info based on error type
    let debugInfo = {};
    if (error.message.includes('unauthorized') || error.message.includes('Access token')) {
      debugInfo = {
        hint: 'Your META_WHATSAPP_ACCESS_TOKEN may be invalid or expired.',
        check: 'Generate a new Page Access Token from Meta Business Suite > Users > Management Tools > Pages'
      };
    } else if (error.message.includes('60200') || error.message.includes('TEMPLATE_NOT_APPROVED')) {
      debugInfo = {
        hint: 'Your template "review_request" is not approved yet in Meta Business Manager.',
        check: 'Go to https://business.facebook.com/business/[YOUR_BUSINESS_ID]/messaging/templates to create and submit for approval.'
      };
    } else if (error.message.includes('60010') || error.message.includes('invalid_id')) {
      debugInfo = {
        hint: 'Your META_WHATSAPP_PHONE_NUMBER_ID may be incorrect or inactive.',
        check: 'Verify phone number ID at https://developers.facebook.com/docs/whatsapp/cloud-api/webhook'
      };
    }
    
    return Response.json({ 
      success: false, 
      error: error.message,
      debug: debugInfo 
    }, { status: 500 });
  }
}