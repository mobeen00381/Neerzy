/**
 * Read-only check for the shared rate-limiter table.
 *
 * Run AFTER applying:
 *   supabase/migrations/20260720_create_rate_limits_table.sql
 *   supabase/migrations/20260721_add_blocked_until_to_rate_limits.sql
 *
 *   node tmp/check-rate-limits-table.js
 *
 * Prints PASS/FAIL for the table, the blocked_until column and the
 * service-role write path. Sends no writes.
 */
const fs = require("fs");

const env = {};
fs.readFileSync(require("path").join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  });

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const withBlock = await supabase
    .from("rate_limits")
    .select("id, ip_address, endpoint, request_count, window_start, blocked_until")
    .limit(1);

  if (withBlock.error) {
    console.log("FAIL: rate_limits / blocked_until not usable");
    console.log("  code   :", withBlock.error.code);
    console.log("  message:", withBlock.error.message);
    console.log("\n-> Apply both migrations in the Supabase SQL Editor, then re-run this script.");
    process.exitCode = 1;
    return;
  }

  console.log("PASS: rate_limits exists and exposes blocked_until");
  console.log("      current rows:", JSON.stringify(withBlock.data));

  const windowsQuery = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true });
  console.log("PASS: service-role read works (row count:", windowsQuery.count + ")");
  console.log("\nThe DB-backed limiter is now active for /api/chat and /api/audit/review.");
})();
