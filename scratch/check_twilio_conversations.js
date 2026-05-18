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

async function checkConversations() {
  console.log('🔌 Querying Twilio Conversations Services...');
  try {
    const services = await client.conversations.v1.services.list();
    console.log(`Found ${services.length} Conversations Services:`);
    for (const service of services) {
      console.log(`\nService: ${service.friendlyName} (SID: ${service.sid})`);
    }
  } catch (error) {
    console.error('❌ Error querying conversations:', error.message);
  }
}

checkConversations();
