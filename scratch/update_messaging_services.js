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

const servicesToUpdate = [
  { sid: 'MG2f2c4d4280eee9b45c7fbcc86040fff9', name: 'Neerzy Verify Sender' },
  { sid: 'MG407e167002c850c84d3ab6c3017ae05c', name: 'Neerzy WhatsApp Service' }
];

async function updateServices() {
  console.log('🔌 Updating Inbound Webhook URLs for Messaging Services...');
  
  for (const service of servicesToUpdate) {
    try {
      console.log(`\nUpdating service: ${service.name} (${service.sid})...`);
      const updated = await client.messaging.v1.services(service.sid).update({
        inboundRequestUrl: 'https://www.neerzy.com/api/whatsapp/webhook',
        inboundMethod: 'POST'
      });
      console.log(`✅ Success! Inbound Request URL set to: ${updated.inboundRequestUrl}`);
    } catch (error) {
      console.error(`❌ Failed to update service ${service.name}:`, error.message);
    }
  }
}

updateServices();
