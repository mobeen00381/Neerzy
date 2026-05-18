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

async function checkServiceConfig() {
  const serviceSid = 'IS8bc24be830704f4a9136b57f2b21d53d';
  console.log(`🔌 Querying Twilio Conversations Service ${serviceSid} Configuration...`);
  try {
    const config = await client.conversations.v1.services(serviceSid).configuration().fetch();
    console.log(`Service Default Chat Role Sid: ${config.defaultChatRoleSid}`);
    console.log(`Service Default Channel Role Sid: ${config.defaultChannelRoleSid}`);
    console.log(`Service Default Creator Role Sid: ${config.defaultChannelCreatorRoleSid}`);

    // Query webhooks for this service
    const webhooks = await client.conversations.v1.services(serviceSid).webhooks.list();
    console.log(`Webhooks configured for this service (${webhooks.length}):`);
    webhooks.forEach(wh => {
      console.log(`  - SID: ${wh.sid}`);
      console.log(`    Target: ${wh.target}`);
      console.log(`    Configuration URL: ${wh.configuration.url}`);
      console.log(`    Configuration Filters: ${wh.configuration.filters}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkServiceConfig();
