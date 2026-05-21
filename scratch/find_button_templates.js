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

async function findButtonTemplates() {
  try {
    const list = await client.content.v1.contents.list({ limit: 100 });
    console.log(`Searching through ${list.length} templates for buttons...`);
    const found = [];
    for (const t of list) {
      const typesStr = JSON.stringify(t.types);
      if (typesStr.includes('button') || typesStr.includes('action') || typesStr.includes('reply') || typesStr.includes('card')) {
        found.push(t);
      }
    }
    console.log(`Found ${found.length} button templates:`);
    for (const t of found) {
      console.log(`\nSID: ${t.sid}`);
      console.log(`Friendly Name: ${t.friendlyName}`);
      console.log(`Types:`, JSON.stringify(t.types, null, 2));
    }
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

findButtonTemplates();
