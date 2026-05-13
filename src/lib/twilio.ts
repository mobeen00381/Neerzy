import twilio from "twilio";

/**
 * Sends a WhatsApp message via Twilio with optional template support
 */
export async function sendTwilioMessage(
  to: string, 
  body: string, 
  templateSid?: string, 
  variables?: Record<string, string>
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = "whatsapp:+14155238886"; // SANDBOX ONLY

  const client = twilio(accountSid, authToken);
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  try {
    // Standard message for Sandbox (No templates)
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });
    console.log(`✅ Sandbox WhatsApp message sent: ${message.sid}`);
    return message;
  } catch (error: any) {
    console.error("❌ Twilio Error:", error.message || error);
    
    // If it's a window error and we have an OTP template but didn't use it, 
    // that's handled in the specific routes. For general messages, we just log and throw.
    throw error;
  }
}
