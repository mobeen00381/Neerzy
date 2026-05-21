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

async function checkId() {
  const id = 'a982df4d-5eb3-4042-977f-38057c158acf';
  
  const { data: postData, error: postErr } = await supabase
    .from('pending_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  console.log('pending_posts:', { postData, postErr });

  const { data: jobData, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  console.log('jobs:', { jobData, jobErr });
}

checkId();
