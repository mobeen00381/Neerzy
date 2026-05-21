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

async function listAllTemplates() {
  try {
    const list = await client.content.v1.contents.list({ limit: 50 });
    console.log(`Found ${list.length} templates:`);
    for (const t of list) {
      console.log(`\nSID: ${t.sid}`);
      console.log(`Friendly Name: ${t.friendlyName}`);
      console.log(`Language: ${t.language}`);
      console.log(`Types:`, JSON.stringify(t.types, null, 2));
    }
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

listAllTemplates();
