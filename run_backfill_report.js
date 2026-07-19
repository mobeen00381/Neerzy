// Run the pending_posts backfill analysis and report
// Uses Supabase REST API — first checks if user_id column exists, then backfills
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uheshftvnvifibyolixf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZXNoZnR2bnZpZmlieW9saXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3MzkzMSwiZXhwIjoyMDkwNTQ5OTMxfQ.oTjZyssMM5mHm06wmOKadRiIOCgpINxE1Izh0Bo8bYw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  console.log('=== PENDING_POSTS BACKFILL REPORT ===\n');

  // Step 1: Check if user_id column exists by trying to select it
  console.log('Checking if user_id column exists...');
  const { data: colCheck, error: colErr } = await supabase
    .from('pending_posts')
    .select('user_id')
    .limit(1);
  
  const columnExists = !colErr || !colErr.message?.includes('does not exist');
  console.log(`  user_id column exists: ${columnExists}`);
  
  if (!columnExists) {
    console.log('\n⚠️  user_id column does not exist on pending_posts.');
    console.log('   You need to run the migration first via Supabase Dashboard SQL Editor:');
    console.log('\n   ALTER TABLE public.pending_posts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;');
    console.log('   CREATE INDEX IF NOT EXISTS idx_pending_posts_user_id ON public.pending_posts(user_id);\n');
    console.log('   After running that SQL, re-run this script to do the backfill.\n');
    return;
  }

  // Step 2: Count pending_posts
  const { data: pendingPosts, error: ppErr } = await supabase
    .from('pending_posts')
    .select('id, user_id, user_phone, status');
  
  if (ppErr) { 
    console.error('Error fetching pending_posts:', JSON.stringify(ppErr, null, 2)); 
    return; 
  }
  
  const total = pendingPosts?.length || 0;
  const withUserId = pendingPosts?.filter(p => p.user_id).length || 0;
  const nullUserId = total - withUserId;
  
  console.log(`\nTotal pending_posts: ${total}`);
  console.log(`With user_id: ${withUserId}`);
  console.log(`Null user_id: ${nullUserId}`);
  console.log(`Match rate: ${total > 0 ? ((withUserId / total) * 100).toFixed(1) : 'N/A'}%\n`);

  // Step 3: Get all users for matching
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, phone');
  
  console.log(`Total users in public.users: ${allUsers?.length || 0}\n`);
  
  // Step 4: Phone format analysis for unmatched rows
  if (nullUserId > 0) {
    console.log('=== PHONE FORMAT ANALYSIS (unmatched rows) ===\n');
    
    const unmatched = pendingPosts?.filter(p => !p.user_id) || [];
    
    // Categorize phone formats
    const formats = { with_plus: 0, without_plus: 0, with_00: 0, local: 0, empty: 0, other: 0 };
    const samples = { with_plus: [], without_plus: [], local: [], other: [] };
    
    for (const p of unmatched) {
      const phone = (p.user_phone || '').replace('whatsapp:', '');
      if (!phone) { formats.empty++; continue; }
      if (phone.startsWith('+')) { 
        formats.with_plus++; 
        if (samples.with_plus.length < 5) samples.with_plus.push(phone);
      } else if (phone.startsWith('00')) { 
        formats.with_00++; 
      } else if (phone.startsWith('0')) { 
        formats.local++; 
        if (samples.local.length < 5) samples.local.push(phone);
      } else if (/^\d{10,15}$/.test(phone)) { 
        formats.without_plus++; 
        if (samples.without_plus.length < 5) samples.without_plus.push(phone);
      } else { 
        formats.other++; 
        if (samples.other.length < 5) samples.other.push(phone);
      }
    }
    
    console.log(`  +XX (E.164):     ${formats.with_plus}`);
    console.log(`  XX (no +):       ${formats.without_plus}`);
    console.log(`  00XX:            ${formats.with_00}`);
    console.log(`  0XX (local):     ${formats.local}`);
    console.log(`  empty:           ${formats.empty}`);
    console.log(`  other:           ${formats.other}`);
    console.log('');
    console.log('Sample phones (unmatched):');
    console.log('  With +:     ', samples.with_plus.join(', '));
    console.log('  Without +:  ', samples.without_plus.join(', '));
    console.log('  Local (0):  ', samples.local.join(', '));
    console.log('  Other:      ', samples.other.join(', '));
    
    // Step 5: Check what format users.phone uses
    console.log('\n=== USERS TABLE PHONE FORMAT ===\n');
    const sampleUsers = (allUsers || []).slice(0, 10);
    console.log('Sample user phones:');
    for (const u of sampleUsers) {
      console.log(`  "${u.phone}"`);
    }
    
    // Step 6: Try matching with normalized phones (in-memory analysis)
    console.log('\n=== ATTEMPTING NORMALIZED MATCH (in-memory) ===\n');
    
    // Build lookup maps
    const exactMap = new Map();      // exact phone string -> user_id
    const normalizedMap = new Map(); // digits-only -> user_id
    
    for (const u of (allUsers || [])) {
      exactMap.set(u.phone, u.id);
      const normalized = u.phone.replace(/[^\d]/g, '');
      normalizedMap.set(normalized, u.id);
    }
    
    let exactMatch = 0;
    let normalizedMatch = 0;
    let stillUnmatched = 0;
    
    for (const p of unmatched) {
      const phone = (p.user_phone || '').replace('whatsapp:', '');
      const normalized = phone.replace(/[^\d]/g, '');
      
      // Try exact match
      if (exactMap.has(phone)) {
        exactMatch++;
        continue;
      }
      
      // Try normalized match (digits only)
      if (normalizedMap.has(normalized)) {
        normalizedMatch++;
        continue;
      }
      
      // Try with + prefix
      if (!phone.startsWith('+') && exactMap.has('+' + normalized)) {
        normalizedMatch++;
        continue;
      }
      
      // Try without + prefix
      if (phone.startsWith('+') && exactMap.has(normalized)) {
        normalizedMatch++;
        continue;
      }
      
      stillUnmatched++;
    }
    
    console.log(`Exact phone match:        ${exactMatch}/${nullUserId}`);
    console.log(`Normalized match:         ${normalizedMatch}/${nullUserId}`);
    console.log(`Still unmatched:          ${stillUnmatched}/${nullUserId}`);
    console.log(`Total matchable:          ${exactMatch + normalizedMatch}/${nullUserId}`);
    console.log(`Match rate (of nulls):    ${nullUserId > 0 ? (((exactMatch + normalizedMatch) / nullUserId) * 100).toFixed(1) : 'N/A'}%`);
    
    // Step 7: Show unmatched phone samples
    if (stillUnmatched > 0) {
      console.log('\n=== SAMPLE UNMATCHABLE PHONES ===\n');
      let count = 0;
      for (const p of unmatched) {
        if (count >= 10) break;
        const phone = (p.user_phone || '').replace('whatsapp:', '');
        const normalized = phone.replace(/[^\d]/g, '');
        
        const exact = exactMap.has(phone);
        const norm = normalizedMap.has(normalized);
        
        if (!exact && !norm) {
          console.log(`  "${p.user_phone}" (status: ${p.status})`);
          count++;
        }
      }
    }

    // Step 8: Run the actual backfill via individual updates
    console.log('\n=== RUNNING BACKFILL ===\n');
    
    let updated = 0;
    let errors = 0;
    
    for (const p of unmatched) {
      const phone = (p.user_phone || '').replace('whatsapp:', '');
      const normalized = phone.replace(/[^\d]/g, '');
      
      // Try to find matching user
      let userId = null;
      
      // Exact match
      if (exactMap.has(phone)) {
        userId = exactMap.get(phone);
      }
      // Normalized match
      else if (normalizedMap.has(normalized)) {
        userId = normalizedMap.get(normalized);
      }
      // Try with + prefix
      else if (!phone.startsWith('+') && exactMap.has('+' + normalized)) {
        userId = exactMap.get('+' + normalized);
      }
      // Try without + prefix
      else if (phone.startsWith('+') && exactMap.has(normalized)) {
        userId = exactMap.get(normalized);
      }
      
      if (userId) {
        const { error } = await supabase
          .from('pending_posts')
          .update({ user_id: userId })
          .eq('id', p.id);
        
        if (error) {
          console.error(`  Error updating ${p.id}: ${error.message}`);
          errors++;
        } else {
          updated++;
        }
      }
    }
    
    // Final count
    const { data: after } = await supabase
      .from('pending_posts')
      .select('id, user_id');
    
    const finalTotal = after?.length || 0;
    const finalWithUserId = after?.filter(p => p.user_id).length || 0;
    const finalNullUserId = finalTotal - finalWithUserId;
    
    console.log(`\n=== FINAL RESULT ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${finalTotal}`);
    console.log(`With user_id: ${finalWithUserId}`);
    console.log(`Null user_id: ${finalNullUserId}`);
    console.log(`Final match rate: ${finalTotal > 0 ? ((finalWithUserId / finalTotal) * 100).toFixed(1) : 'N/A'}%`);
  } else {
    console.log('No unmatched rows to backfill.');
  }
}

run().catch(console.error);
