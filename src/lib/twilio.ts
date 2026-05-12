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
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || "whatsapp:+18338872999";

  const client = twilio(accountSid, authToken);
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  try {
    // If template SID is provided, use it
    if (templateSid) {
      const message = await client.messages.create({
        from: fromNumber,
        to: formattedTo,
        contentSid: templateSid,
        contentVariables: variables ? JSON.stringify(variables) : undefined,
      });
      console.log(`✅ WhatsApp template message sent: ${message.sid}`);
      return message;
    }

    // Otherwise, try standard message
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });
    console.log(`✅ WhatsApp message sent: ${message.sid}`);
    return message;
  } catch (error: any) {
    console.error("❌ Twilio Error:", error.message || error);
    
    // If it's a window error and we have an OTP template but didn't use it, 
    // that's handled in the specific routes. For general messages, we just log and throw.
    throw error;
  }
}
