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

async function testSaveDraft() {
  const phone = '+923006291617';
  console.log('Querying existing draft...');
  const { data: existing, error } = await supabase
    .from('pending_posts')
    .select('id, images, customer_phone')
    .eq('user_phone', phone)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('Existing:', existing, 'Error:', error);

  const data = { imageUrl: 'https://example.com/test-real-image.jpg' };
  const newImages = existing?.images ? [...existing.images, data.imageUrl] : [data.imageUrl];
  console.log('New Images array:', newImages);

  if (!existing) {
    console.log('Inserting new draft...');
    const res = await supabase.from('pending_posts').insert({
      user_phone: phone,
      images: newImages,
      status: 'draft'
    }).select();
    console.log('Insert Result:', res);
  } else {
    console.log('Updating existing draft...');
    const res = await supabase.from('pending_posts').update({ images: newImages }).eq('id', existing.id).select();
    console.log('Update Result:', res);
  }
}

testSaveDraft();
