// Verify review_requests table exists and check its structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uheshftvnvifibyolixf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZXNoZnR2bnZpZmlieW9saXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3MzkzMSwiZXhwIjoyMDkwNTQ5OTMxfQ.oTjZyssMM5mHm06wmOKadRiIOCgpINxE1Izh0Bo8bYw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
  // Try to query the table
  const { data, error } = await supabase
    .from('review_requests')
    .select('*')
    .limit(5);
  
  if (error) {
    console.log('❌ Error querying review_requests:', error.message);
    console.log('\nTrying to check if table exists in information_schema...');
    
    const { data: tables, error: tblError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'review_requests');
    
    if (tblError) {
      console.log('Cannot access information_schema:', tblError.message);
    } else {
      console.log('Tables found:', tables);
    }
  } else {
    console.log('✅ review_requests table exists!');
    console.log(`Found ${data.length} rows.`);
    if (data.length > 0) {
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Table is empty (no review requests yet).');
      console.log('Columns available:', Object.keys(supabase.from('review_requests').select('*').toPromise().then(() => {})));
    }
  }
}

verify().catch(console.error);
