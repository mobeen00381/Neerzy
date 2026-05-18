const axios = require('axios');
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
const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

async function checkServiceChannels() {
  console.log('🔌 Querying Channels in Messaging Services via Axios...');
  try {
    // 1. Get services
    const servicesRes = await axios.get(`https://messaging.twilio.com/v1/Services`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    const services = servicesRes.data.services;
    console.log(`Found ${services.length} services:`);
    
    for (const service of services) {
      console.log(`\n============================================`);
      console.log(`Service: ${service.friendly_name} (SID: ${service.sid})`);
      console.log(`Inbound Request URL: ${service.inbound_request_url}`);
      
      // Get channels
      const channelsRes = await axios.get(`https://messaging.twilio.com/v1/Services/${service.sid}/Channels`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      const channels = channelsRes.data.channels;
      console.log(`Channels (${channels.length}):`);
      channels.forEach(ch => {
        console.log(`  - Channel SID: ${ch.sid} (${ch.channel_sid})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkServiceChannels();
