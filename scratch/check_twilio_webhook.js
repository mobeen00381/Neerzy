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
const whatsappNumber = getEnvVar('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+923056500917';

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials in .env.local');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkTwilioConfig() {
  console.log('🔌 Connecting to Twilio API...');
  console.log('Account SID:', accountSid);
  console.log('Configured WhatsApp Number:', whatsappNumber);

  try {
    // 1. Fetch WhatsApp senders (if any are registered on the account)
    console.log('\n🔍 Fetching registered WhatsApp Senders...');
    const senders = await client.conversations.v1.services.list(); // or other endpoints
    console.log(`Found ${senders.length} conversation services.`);

    // 2. Fetch Incoming Phone Numbers
    console.log('\n🔍 Fetching incoming phone numbers on the account...');
    const incomingNumbers = await client.incomingPhoneNumbers.list();
    console.log(`Found ${incomingNumbers.length} active phone numbers:`);
    incomingNumbers.forEach(num => {
      console.log(`- Phone: ${num.phoneNumber} (SID: ${num.sid})`);
      console.log(`  SmsUrl: ${num.smsUrl}`);
      console.log(`  VoiceUrl: ${num.voiceUrl}`);
    });

    // 3. Let's check Sandbox Webhook configuration!
    // In Twilio, sandbox settings are in the account's sandbox properties or settings.
    // The Sandbox is configured at the API level as a standard webhook on the Sandbox number.
    // Let's try to query the sandbox or standard message settings.
    console.log('\n🔍 Checking if there are active Twilio WhatsApp Send attempts or logs...');
    const messages = await client.messages.list({ limit: 5 });
    console.log(`Recent messages in Twilio logs:`);
    messages.forEach(msg => {
      console.log(`- From: ${msg.from} -> To: ${msg.to} (Status: ${msg.status}, Date: ${msg.dateCreated})`);
      console.log(`  Body: "${msg.body}"`);
      if (msg.errorMessage) console.log(`  Error: ${msg.errorMessage}`);
    });

  } catch (error) {
    console.error('❌ Error querying Twilio:', error.message);
  }
}

checkTwilioConfig();
