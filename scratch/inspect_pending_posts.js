const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually to get Supabase URL and key
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log('🔌 Connecting to Supabase...');

  const tempPhone = 'test_probe_' + Math.random().toString().substring(2, 8);

  // Insert a test row with a non-null user_phone
  console.log('📝 Inserting temporary test probe...');
  const { data: insertData, error: insertErr } = await supabase
    .from('pending_posts')
    .insert({
      user_phone: tempPhone,
      status: 'draft',
      images: ['https://example.com/test.jpg']
    })
    .select();

  if (insertErr) {
    console.error('❌ Insert failed:', insertErr);
    return;
  }

  console.log('✅ Temporary insert succeeded!');
  const record = insertData[0];
  console.log('Columns in pending_posts:', Object.keys(record));
  console.log('Full Record Content:', record);

  // Clean up: Delete the temporary probe row
  console.log('🧹 Cleaning up probe row...');
  const { error: deleteErr } = await supabase
    .from('pending_posts')
    .delete()
    .eq('user_phone', tempPhone);

  if (deleteErr) {
    console.error('⚠️ Could not delete probe row:', deleteErr);
  } else {
    console.log('✨ Clean up finished successfully!');
  }
}

inspectTable();
