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
const twilioClient = twilio(accountSid, authToken);

async function testSend() {
  const to = '+923006291617';
  const from = 'whatsapp:+923056500917';
  const body = '✅ *Saved (Test).*';

  console.log(`Sending message from ${from} to whatsapp:${to}...`);
  try {
    const message = await twilioClient.messages.create({
      from: from,
      to: `whatsapp:${to}`,
      body: body
    });
    console.log('✅ Message sent successfully! SID:', message.sid);
  } catch (error) {
    console.error('❌ Twilio send error:', error.message);
    console.error(error);
  }
}

testSend();
