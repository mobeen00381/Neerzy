/**
 * validate-cta-label.mjs
 * ───────────────────────
 * Sends the WhatsApp interactive `cta_url` message with the FIXED button label
 * ('📲 Send via SMS' — 14 chars, under Meta's 20-char display_text limit) to a
 * recipient of your choice, replicating exactly what the webhook sends at
 * src/app/api/whatsapp/webhook/route.ts (sendMetaInteractiveUrlButton).
 *
 * Usage (run from repo root):
 *   node scripts/validate-cta-label.mjs --to 1XXXXXXXXXX          # fixed label → your number
 *   node scripts/validate-cta-label.mjs --to 1XXXXXXXXXX --old    # ALSO proves old label is rejected
 *   node scripts/validate-cta-label.mjs --to 1XXXXXXXXXX --dry-run # print payload without sending
 *   node scripts/validate-cta-label.mjs --last-trader             # auto-target most recent manual_fallback trader
 *   node scripts/validate-cta-label.mjs --to 1XXXXXXXXXX --id <uuid> # button URL → a specific review request
 *   (The button URL always uses the real review request id when known, so clicking it
 *    opens a working /sms/[id] page instead of "Could not load this request".)
 *
 * Reads META_WHATSAPP_ACCESS_TOKEN + META_WHATSAPP_PHONE_NUMBER_ID from .env.local.
 * Never logs the token or the full recipient number beyond the last 4 digits.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── .env.local loader (no dotenv dependency needed) ─────────────────────────
function loadEnv() {
  const envFile = path.join(ROOT, '.env.local');
  const env = {};
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.local not found. Run this from the repo root.');
    process.exit(1);
  }
  for (const raw of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const to = getArg('--to') || getArg('--self');
const idArg = getArg('--id');
const testOld = args.includes('--old');
const dryRun = args.includes('--dry-run');
const lastTrader = args.includes('--last-trader');

const env = loadEnv();
const TOKEN = env.META_WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = env.META_WHATSAPP_PHONE_NUMBER_ID;
const META_VERSION = 'v22.0';
const META_URL = `https://graph.facebook.com/${META_VERSION}/${PHONE_NUMBER_ID}/messages`;

if (!TOKEN || !PHONE_NUMBER_ID) {
  console.error('❌ META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID missing in .env.local');
  process.exit(1);
}
console.log(`🔌 Using phone number ID: ${PHONE_NUMBER_ID} (token present: ${TOKEN ? 'yes' : 'no'})`);

// ── resolve recipient + review request ──────────────────────────────────────
let recipient = to;
let reviewId = idArg || null;
if (!recipient && lastTrader) {
  // PostgREST: latest manual_fallback review request + trader phone from profiles/users
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Supabase URL/service key missing for --last-trader');
    process.exit(1);
  }
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  // PostgREST returns a plain JSON array (no { data } wrapper).
  const rows = await fetch(
    `${SUPABASE_URL}/rest/v1/review_requests?select=id,user_id,customer_name,status&status=eq.manual_fallback&order=updated_at.desc&limit=1`,
    { headers }
  ).then((r) => r.json());
  const row = rows?.[0];
  if (!row) {
    console.error('❌ No manual_fallback review request found to target.');
    process.exit(1);
  }
  reviewId = row.id; // real UUID → button URL opens a working page
  for (const table of ['profiles', 'users']) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=phone,id&id=eq.${row.user_id}&limit=1`,
      { headers }
    );
    const found = (await res.json())?.[0];
    if (found?.phone) {
      recipient = found.phone;
      break;
    }
  }
  if (!recipient) {
    console.error(`❌ Could not resolve trader phone for user ${row.user_id}.`);
    process.exit(1);
  }
  console.log(`🎯 Targeting most recent manual_fallback request (customer: ${row.customer_name || 'n/a'})`);
}

if (!recipient) {
  console.error('❌ No recipient. Pass --to 1XXXXXXXXXX or --last-trader.');
  console.error('   e.g. node scripts/validate-cta-label.mjs --to 15551234567');
  process.exit(1);
}
const clean = recipient.replace(/[^\d+]/g, '');
console.log(`📲 Sending to: ${clean.slice(0, -4)}${'*'.repeat(4)}`);
console.log(`🔗 Button URL: https://neerzy.com/sms/${reviewId || 'NO_ID'}`);

// ── payload builder (mirrors sendMetaInteractiveUrlButton in src/lib/whatsapp.ts) ──
function buildBody(displayText) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: clean,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: 'Tap below to copy the SMS message, or open your SMS app with everything pre-filled.' },
      action: {
        name: 'cta_url',
        parameters: { display_text: displayText, url: `https://neerzy.com/sms/${reviewId || 'validate-fix'}` },
      },
    },
  };
}

async function send(label) {
  const body = buildBody(label);
  const labelLen = [...label].length; // code-point count (what Meta enforces)
  console.log(`\n▶ Testing label: "${label}"  (${labelLen} chars, limit 20 → ${labelLen <= 20 ? 'OK' : 'OVER LIMIT ❌'})`);
  if (dryRun) {
    console.log('  [dry-run] Payload:', JSON.stringify(body, null, 2));
    return null;
  }
  const res = await fetch(META_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.messages?.[0]?.id) {
    console.log(`  ✅ ACCEPTED — Meta message ID: ${data.messages[0].id}`);
    return true;
  }
  console.log(`  ❌ REJECTED — HTTP ${res.status}: code ${data.error?.code}, message: ${data.error?.message}`);
  return false;
}

// ── run ─────────────────────────────────────────────────────────────────────
const fixedLabel = '📲 Send via SMS'; // the fix (14 chars)
let oldResult = null;
if (testOld) oldResult = await send('📲 Copy & Send via SMS'); // expected REJECTED (21-22 chars)
const fixedResult = await send(fixedLabel);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (testOld) {
  console.log(`Old label 21-22 chars → Meta ${oldResult ? 'ACCEPTED' : 'REJECTED (expected: REJECTED)'}`);
}
console.log(`Fixed label "📲 Send via SMS" → Meta ${fixedResult ? 'ACCEPTED ✅' : 'REJECTED ❌'}`);
console.log(fixedResult
  ? '🎉 The fix is confirmed at the Meta API level. You can now re-run the Bao flow end-to-end.'
  : '⚠️ The fixed label was still rejected — inspect the error code above.');

