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
const postReadySid = getEnvVar('TWILIO_TEMPLATE_POST_READY');
const reviewRequestSid = getEnvVar('TWILIO_TEMPLATE_REVIEW_REQUEST');

const client = twilio(accountSid, authToken);

async function fetchTemplate(sid) {
  try {
    const content = await client.content.v1.contents(sid).fetch();
    console.log(`\n=================== Template: ${sid} ===================`);
    console.log(`Friendly Name: ${content.friendlyName}`);
    console.log(`Language: ${content.language}`);
    console.log(`Variables:`, content.variables);
    console.log(`Types:`, JSON.stringify(content.types, null, 2));
  } catch (error) {
    console.error(`Error fetching template ${sid}:`, error.message);
  }
}

async function run() {
  if (postReadySid) {
    await fetchTemplate(postReadySid);
  }
  if (reviewRequestSid) {
    await fetchTemplate(reviewRequestSid);
  }
}

run();
