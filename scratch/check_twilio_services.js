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

async function checkServices() {
  console.log('🔌 Querying Twilio Messaging Services...');

  try {
    // 1. List all messaging services
    const services = await client.messaging.v1.services.list();
    console.log(`Found ${services.length} Messaging Services:`);
    
    for (const service of services) {
      console.log(`\n============================================`);
      console.log(`Service Name: ${service.friendlyName} (SID: ${service.sid})`);
      console.log(`Inbound Request URL: ${service.inboundRequestUrl}`);
      console.log(`Status Callback URL: ${service.statusCallback}`);
      console.log(`Inbound Method: ${service.inboundMethod}`);
      
      // List senders in this service
      const senders = await client.messaging.v1.services(service.sid).phoneNumbers.list();
      console.log(`Phone Senders in this service (${senders.length}):`);
      senders.forEach(sender => {
        console.log(`  - Phone: ${sender.phoneNumber} (SID: ${sender.sid})`);
      });

      const alphaSenders = await client.messaging.v1.services(service.sid).alphaSenders.list();
      if (alphaSenders.length > 0) {
        console.log(`Alpha Senders in this service (${alphaSenders.length}):`);
        alphaSenders.forEach(sender => {
          console.log(`  - Alpha: ${sender.alphaSender}`);
        });
      }

      const shortCodes = await client.messaging.v1.services(service.sid).shortCodes.list();
      if (shortCodes.length > 0) {
        console.log(`Shortcodes in this service (${shortCodes.length}):`);
        shortCodes.forEach(sc => {
          console.log(`  - Shortcode: ${sc.shortCode}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error querying services:', error.message);
  }
}

checkServices();
