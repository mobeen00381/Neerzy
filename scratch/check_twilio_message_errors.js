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

async function checkErrors() {
  console.log('🔌 Querying Twilio message delivery logs...');

  try {
    const messages = await client.messages.list({ limit: 10 });
    
    for (const msg of messages) {
      console.log(`\n--------------------------------------------`);
      console.log(`SID: ${msg.sid}`);
      console.log(`From: ${msg.from} -> To: ${msg.to}`);
      console.log(`Status: ${msg.status}`);
      console.log(`Date: ${msg.dateCreated}`);
      console.log(`Body: "${msg.body}"`);
      console.log(`NumMedia: ${msg.numMedia}`);
      
      if (parseInt(msg.numMedia) > 0) {
        // Fetch media list
        const mediaList = await client.messages(msg.sid).media.list();
        mediaList.forEach(media => {
          console.log(`  - Media URL: https://api.twilio.com${media.uri.replace('.json', '')}`);
        });
      }

      // Check if there are execution logs/debugger events on Twilio
      // We can query the Twilio Monitor/Alerts API to see if there were webhook failures!
    }

    console.log('\n🔍 Checking Twilio Debugger Alerts (last 5)...');
    const alerts = await client.monitor.alerts.list({ limit: 5 });
    if (alerts.length === 0) {
      console.log('✅ No active Twilio Debugger alerts found.');
    } else {
      alerts.forEach(alert => {
        console.log(`⚠️ Alert: ${alert.alertText}`);
        console.log(`  Code: ${alert.errorCode}`);
        console.log(`  Date: ${alert.dateCreated}`);
        console.log(`  Resource: ${alert.resourceSid}`);
        if (alert.requestVariables) {
          console.log(`  Request: ${alert.requestVariables}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkErrors();
