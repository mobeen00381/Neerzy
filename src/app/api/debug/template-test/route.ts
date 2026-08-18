// app/api/debug/template-test/route.ts
import { sendMetaTemplate } from '@/lib/whatsapp';

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = clean.startsWith('+') ? clean : `+${clean}`;

  try {
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
      raw: result 
    });
  } catch (error: any) {
    console.error('❌ Template send error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
