import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTwilioMessage } from '@/lib/twilio';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function getJob(jobId: string) {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error("Failed to fetch job:", error);
    return null;
  }
  return data;
}

async function getBusinessByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.warn("Failed to fetch business for user:", userId);
    return null;
  }
  return data;
}

const sendWhatsApp = async (to: string, body: string) => {
  // Ensure the number has the correct format for Twilio (e.g. +1... or whatsapp:+1...)
  // Assuming sendTwilioMessage handles the 'whatsapp:' prefix appropriately.
  return sendTwilioMessage(to, body);
};

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    
    const job = await getJob(jobId);
    if (!job?.customer_phone) {
      return NextResponse.json({ error: 'No customer phone' }, { status: 400 });
    }

    // Get review link from business profile
    const business = await getBusinessByUserId(job.user_id);
    const reviewLink = business?.google_review_link || `https://search.google.com/local/writereview?placeid=${business?.google_place_id || 'DEFAULT_PLACE_ID'}`;

    // Send WhatsApp to customer
    const reviewTemplateSid = process.env.TWILIO_WHATSAPP_REVIEW_TEMPLATE_SID;
    
    if (reviewTemplateSid) {
      // Assuming the template variables are: 1 = customer name, 2 = review link
      // If the template only has one variable, adjust accordingly. 
      // Typical review template: "Hi {{1}}, thanks for your business! Please leave a review: {{2}}"
      await sendTwilioMessage(
        job.customer_phone, 
        "", 
        reviewTemplateSid, 
        { "1": job.customer_name, "2": reviewLink }
      );
    } else {
      await sendWhatsApp(job.customer_phone, `Hi ${job.customer_name}! 👋\n\nThanks for choosing us for your service. Would you mind leaving a quick review? It helps us grow! ⭐\n\n🔗 ${reviewLink}\n\nReply STOP to opt out.`);
    }

    // Update status
    await supabaseAdmin
      .from('jobs')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', jobId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("mark-published Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
