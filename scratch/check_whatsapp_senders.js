const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
const authToken = getEnvVar('TWILIO_AUTH_TOKEN');

const client = twilio(accountSid, authToken);

async function checkWhatsAppSenders() {
  console.log('🔌 Querying WhatsApp Senders via Twilio Senders API...');

  try {
    const axios = require('axios');
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    console.log('🔍 Querying WhatsApp Senders via Channel Senders API (Channel=whatsapp)...');
    const response = await axios.get(`https://messaging.twilio.com/v2/Channels/Senders?Channel=whatsapp`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    console.log('Senders:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error querying WhatsApp senders:', error.message);
    if (error.response) {
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkWhatsAppSenders();
