const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDraft() {
  console.log('🔌 Connecting to Supabase...');
  const targetPhone = '+923006291617';

  const { data, error } = await supabase
    .from('pending_posts')
    .select('*')
    .eq('user_phone', targetPhone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching draft:', error);
    return;
  }

  console.log('✅ Query completed successfully!');
  console.log(`Found ${data.length} records for ${targetPhone}:`);
  console.log(JSON.stringify(data, null, 2));
}

checkDraft();
