/**
 * Confirms the DEPLOYED chat endpoint keys the rate limiter by the real visitor
 * IP (Cloudflare cf-connecting-ip), not Cloudflare's edge address.
 *   node tmp/verify-prod-keying.js
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
  const trace = await (await fetch("https://www.cloudflare.com/cdn-cgi/trace")).text();
  const myIp = Object.fromEntries(trace.trim().split("\n").map((l) => l.split("="))).ip;
  console.log("my real egress IP:", myIp);

  // Cloudflare-keyed rows are leftovers from before the fix - drop them.
  for (const prefix of ["162.158.", "172.69.", "172.70.", "172.71.", "188.114."]) {
    const { error } = await supabase.from("rate_limits").delete().like("ip_address", `${prefix}%`);
    if (error) console.warn(`cleanup ${prefix} -`, error.message);
  }

  const res = await fetch("https://www.neerzy.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "what are your plans and pricing?" }] }),
  });
  console.log("chat status:", res.status);
  await new Promise((r) => setTimeout(r, 3000));

  const { data } = await supabase
    .from("rate_limits")
    .select("ip_address, endpoint, request_count, blocked_until");
  console.log("rate_limits rows:", JSON.stringify(data, null, 1));

  const keyedByMe = (data || []).some((r) => r.ip_address === myIp);
  console.log(keyedByMe
    ? "\nPASS: production keyed the limit by the real visitor IP"
    : "\nFAIL: no row for the real visitor IP (still keyed by an edge IP?)");
  process.exitCode = keyedByMe ? 0 : 1;
})();
