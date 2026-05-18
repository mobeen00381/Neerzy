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

async function checkDebugger() {
  console.log('🔌 Querying Twilio Debugger Alerts...');
  try {
    const alerts = await client.monitor.v1.alerts.list({ limit: 10 });
    console.log(`Found ${alerts.length} recent alerts:`);
    alerts.forEach(alert => {
      console.log(`\n--------------------------------------------`);
      console.log(`Date Created: ${alert.dateCreated}`);
      console.log(`Error Code: ${alert.errorCode}`);
      console.log(`Alert Text: ${alert.alertText}`);
      console.log(`Request URL: ${alert.requestUrl}`);
      console.log(`Response Body: ${alert.responseBody}`);
      console.log(`More Info: ${alert.moreInfo}`);
    });
  } catch (error) {
    console.error('❌ Error querying Twilio Debugger:', error.message);
  }
}

checkDebugger();
