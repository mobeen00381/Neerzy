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

async function inspectGbpLocations() {
  const { data, error } = await supabase
    .from('gbp_locations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching gbp_locations:', error);
  } else {
    console.log('Columns in gbp_locations:', data.length > 0 ? Object.keys(data[0]) : 'No records');
    console.log('Sample Gbp Location:', data[0]);
  }
}

inspectGbpLocations();
