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

async function testRoute(id) {
  try {
    console.log(`Testing ID: "${id}"`);
    const { data: post, error: postErr } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (postErr) {
      console.error('Database error pending_posts:', postErr);
    } else {
      console.log('Found in pending_posts:', !!post);
      if (post) {
        const googlePost = post.google_post || '';
        const lines = googlePost.split('\n');
        
        const extractField = (prefix) => {
          const line = lines.find((l) => l.toUpperCase().includes(prefix.toUpperCase()));
          return line ? line.replace(new RegExp(`\\*{0,2}${prefix}\\*{0,2}`, 'i'), '').trim() : '';
        };

        const headline = extractField('HEADLINE:') || 'New Post';
        const body = extractField('BODY:') || post.voice_note || '';
        const cta = extractField('CTA:') || '';
        const hashtags = extractField('HASHTAGS:') || '';

        const fullText = [headline, '', body, '', cta, '', hashtags].filter(Boolean).join('\n');
        console.log('Resulting text:\n', fullText);
      }
    }

    // Fallback to jobs
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (jobErr) {
      console.error('Database error jobs:', jobErr);
    } else {
      console.log('Found in jobs:', !!job);
    }
  } catch (error) {
    console.error('Catch block error:', error);
  }
}

async function run() {
  await testRoute('e8b6f896-4885-4f55-b748-a1fc09c90dfe');
  console.log('\n--- Testing invalid UUID ---');
  await testRoute('invalid-uuid');
}

run();
