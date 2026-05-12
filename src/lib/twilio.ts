import twilio from "twilio";

/**
 * Sends a WhatsApp message via Twilio
 */
export async function sendTwilioMessage(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || "whatsapp:+18338872999";

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    });
    console.log(`✅ WhatsApp message sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("❌ Twilio Error:", error);
    throw error;
  }
}
