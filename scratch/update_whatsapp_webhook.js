const fs = require('fs');
const path = require('path');
const axios = require('axios');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
const authToken = getEnvVar('TWILIO_AUTH_TOKEN');

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials in .env.local');
  process.exit(1);
}

const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
const senderSid = 'XE64b1c79207dacb140c91c5b85da0c593'; // SID for whatsapp:+923056500917

async function updateWebhook() {
  console.log(`🔌 Updating Twilio WhatsApp Sender XE64b1c79207dacb140c91c5b85da0c593 via nested JSON...`);

  try {
    const payload = {
      webhook: {
        callback_url: 'https://www.neerzy.com/api/whatsapp/webhook',
        callback_method: 'POST',
        fallback_url: '',
        fallback_method: 'POST',
        status_callback_url: 'https://www.neerzy.com/api/webhooks/twilio-status',
        status_callback_method: 'POST'
      }
    };

    console.log('Sending PATCH request with payload:', JSON.stringify(payload, null, 2));

    const response = await axios.patch(
      `https://messaging.twilio.com/v2/Channels/Senders/${senderSid}`,
      payload,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Update successful! Response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error updating webhook:', error.message);
    if (error.response) {
      console.error('  Response Status:', error.response.status);
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

updateWebhook();
