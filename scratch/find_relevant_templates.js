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

async function findRelevantTemplates() {
  try {
    const list = await client.content.v1.contents.list({ limit: 100 });
    console.log(`Found ${list.length} total templates. Filtering for relevance...`);
    for (const t of list) {
      const name = t.friendlyName.toLowerCase();
      const typesStr = JSON.stringify(t.types).toLowerCase();
      if (name.includes('post') || name.includes('ready') || name.includes('neerzy') || name.includes('copy') || name.includes('image') || name.includes('gbp')) {
        console.log(`\nSID: ${t.sid}`);
        console.log(`Friendly Name: ${t.friendlyName}`);
        console.log(`Types:`, JSON.stringify(t.types, null, 2));
      }
    }
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

findRelevantTemplates();
