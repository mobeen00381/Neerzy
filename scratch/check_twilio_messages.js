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

async function checkMessages() {
  console.log('🔌 Querying Twilio Messages...');
  try {
    const messages = await client.messages.list({
      limit: 20
    });
    console.log(`Found ${messages.length} recent messages:`);
    messages.forEach(msg => {
      console.log(`\n--------------------------------------------`);
      console.log(`SID: ${msg.sid}`);
      console.log(`Date Sent: ${msg.dateCreated}`);
      console.log(`From: ${msg.from}`);
      console.log(`To: ${msg.to}`);
      console.log(`Direction: ${msg.direction}`);
      console.log(`Status: ${msg.status}`);
      console.log(`Body: ${msg.body}`);
      console.log(`NumMedia: ${msg.numMedia}`);
      if (parseInt(msg.numMedia) > 0) {
        console.log(`Media details available via API.`);
      }
    });
  } catch (error) {
    console.error('❌ Error querying Twilio Messages:', error.message);
  }
}

checkMessages();
