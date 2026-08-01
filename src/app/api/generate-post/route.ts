import { NextResponse } from 'next/server';
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from '@/lib/openai';

const openai = getOpenAIClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, businessName, imageUrl } = body;

    if (!description && !businessName) {
      return NextResponse.json({ error: 'Missing description or business name' }, { status: 400 });
    }

    const aiResponse = await openai.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages: [{
        role: 'user',
        content: `Create a Google Business Profile post for ${businessName || 'Client'}. 
Job details: ${description || 'Completed successfully'}.
${imageUrl ? 'An image of the work is attached.' : ''}

Format exactly as:
HEADLINE: (max 40 chars, catchy)
BODY: (max 250 chars, descriptive)
CTA: (short call to action)
HASHTAGS: (3 relevant hashtags max)`
      }]
    });

    const postContent = aiResponse.choices[0].message.content || '';
    const lines = postContent.split('\n');

    const extractField = (prefix: string) => {
      const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
      return line ? line.replace(new RegExp(`\\*{0,2}${prefix}\\*{0,2}`, 'i'), '').trim() : '';
    };

    const headline = extractField('HEADLINE:') || businessName || 'Great Work!';
    const bodyText = extractField('BODY:') || description || 'Job completed successfully.';
    const cta = extractField('CTA:') || 'Contact us today!';
    const hashtags = extractField('HASHTAGS:') || '#Service #LocalBusiness';

    const fullText = [headline, '', bodyText, '', cta, '', hashtags].filter(Boolean).join('\n');

    return NextResponse.json({
      success: true,
      headline,
      body: bodyText,
      cta,
      hashtags,
      fullText
    });
  } catch (error: any) {
    console.error('❌ generate-post error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}