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

async function inspectMessage() {
  const sids = ['MM172aca0b82571ac42a72a25c789e1445', 'MM9106a5539e6d598eca070d910c355064'];
  console.log(`🔌 Inspecting Twilio Messages...`);
  
  for (const sid of sids) {
    try {
      const msg = await client.messages(sid).fetch();
      console.log(`\n============================================`);
      console.log(`Message SID: ${msg.sid}`);
      console.log(`From: ${msg.from}`);
      console.log(`To: ${msg.to}`);
      console.log(`Direction: ${msg.direction}`);
      console.log(`Status: ${msg.status}`);
      console.log(`Messaging Service SID: ${msg.messagingServiceSid}`);
      console.log(`Error Code: ${msg.errorCode}`);
      console.log(`Error Message: ${msg.errorMessage}`);
      console.log(`Price: ${msg.price} ${msg.priceUnit}`);
      console.log(`Full object properties:`, JSON.stringify(msg, null, 2));
    } catch (error) {
      console.error(`❌ Error fetching message ${sid}:`, error.message);
    }
  }
}

inspectMessage();
