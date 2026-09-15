/**
 * End-to-end guardrail check for the Neerzy AI chat (/api/chat).
 *
 * Regression coverage for the "Chat is briefly busy" bug: public.rate_limits
 * was missing in Supabase, so the fail-closed limiter rejected EVERY visitor -
 * first message included - with HTTP 429, and the widget then showed
 * "Message limit reached. Try again in 0:41."
 *
 * Each visitor is simulated with its own X-Forwarded-For address so the two
 * independent guardrails can be measured separately:
 *
 *   visitor A -> 10/min cap : 1st message + 9 more inside the minute, then lock
 *   visitor B -> off-topic  : 3 consecutive off-topic messages, then lock
 *
 * Needs `next dev` to be runnable and .env.local to hold the Supabase
 * service-role key (used ONLY to clear this harness's own synthetic rows).
 *
 *   node tmp/verify-chat-guardrails.js
 */
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LOG = path.join(__dirname, "verify-chat-guardrails.log");
// TEST-NET-3 (RFC 5737) documentation range - never a real visitor.
const VISITOR_A = "203.0.113.10";
const VISITOR_B = "203.0.113.20";
// Cloudflare sits in front of www.neerzy.com, so Vercel reports the edge IP as
// the first x-forwarded-for entry and cf-connecting-ip carries the visitor.
const CF_EDGE = "172.71.100.5";
const VISITOR_C = "198.51.100.7";
const ON_TOPIC = "what are your plans and pricing?";
const OFF_TOPIC = "what is the weather in london?";

let PORT = 0;
let BASE = "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadEnv() {
  const env = {};
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    });
  return env;
}

function serviceClient() {
  const env = loadEnv();
  const { createClient } = require("@supabase/supabase-js");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Clears synthetic rows so re-runs start from a clean window/lock. */
async function clearSyntheticRows() {
  const supabase = serviceClient();
  for (const ip of [VISITOR_A, VISITOR_B, VISITOR_C, CF_EDGE, "::1"]) {
    const { error } = await supabase
      .from("rate_limits")
      .delete()
      .eq("ip_address", ip);
    if (error) console.warn(`cleanup warning for ${ip}:`, error.message);
  }
}

/** A free port, so a leftover `next dev` can't silently serve stale state. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function ask(content, ip, extraHeaders = {}) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
      ...extraHeaders,
    },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      // GET is not exported by the route (405) -> proves the server is up
      // without touching the POST rate-limit budget.
      const res = await fetch(BASE, { method: "GET" });
      if (res.status) return true;
    } catch {
      /* not up yet */
    }
    await sleep(2000);
  }
  return false;
}

let failures = 0;

function check(label, ok, detail = "") {
  console.log(`   ${ok ? "PASS" : "FAIL"}: ${label}${detail ? " - " + detail : ""}`);
  if (!ok) failures++;
}

(async () => {
  fs.writeFileSync(LOG, "");
  await clearSyntheticRows();
  PORT = await freePort();
  BASE = `http://localhost:${PORT}/api/chat`;
  console.log(`using port ${PORT} (synthetic visitor rows cleared)\n`);

  const out = fs.openSync(LOG, "a");
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev", "-p", String(PORT)],
    { cwd: ROOT, stdio: ["ignore", out, out], shell: true }
  );

  try {
    if (!(await waitForServer())) throw new Error("dev server never became ready");

    console.log('1) visitor A - first message "can i quit antime?" must NOT be limited');
    const first = await ask("can i quit antime?", VISITOR_A);
    const reply = String(first.body?.reply || "");
    console.log(`   status: ${first.status}  reply: ${JSON.stringify(reply).slice(0, 90)}...`);
    check("status is 200 (not 429)", first.status === 200, `got ${first.status}`);
    check("cancellation FAQ answered", /cancel anytime/i.test(reply));

    console.log("\n2) visitor A - 10/min cap, then a 1-hour lock");
    let ok = 0;
    let limited = 0;
    for (let i = 0; i < 12; i++) {
      const r = await ask(ON_TOPIC, VISITOR_A);
      if (r.status === 200) ok++;
      else limited++;
    }
    console.log(`   allowed: ${ok}  rejected(429): ${limited}   (expected 9 / 3)`);
    check("exactly 10 requests per minute allowed", ok === 9 && limited === 3, `${ok} allowed`);
    const locked = await ask(ON_TOPIC, VISITOR_A);
    console.log(`   lock payload: ${JSON.stringify(locked.body).slice(0, 120)}`);
    check("over-limit visitor is locked for ~1h", locked.status === 429 && locked.body?.locked === true);

    console.log("\n3) visitor B - 3 consecutive off-topic messages lock the IP");
    const off1 = await ask(OFF_TOPIC, VISITOR_B);
    const off2 = await ask(OFF_TOPIC, VISITOR_B);
    const off3 = await ask(OFF_TOPIC, VISITOR_B);
    const off4 = await ask(OFF_TOPIC, VISITOR_B);
    console.log(`   statuses: ${[off1, off2, off3, off4].map((r) => r.status).join(", ")}`);
    check("first 3 off-topic replies are served as off-topic",
      [off1, off2, off3].every((r) => r.status === 200));
    check("4th is blocked (off-topic lock)", off4.status === 429);

    console.log("\n4) behind Cloudflare: key on the visitor, not the edge IP");
    const viaCf = await ask(ON_TOPIC, CF_EDGE, { "cf-connecting-ip": VISITOR_C });
    check("request served", viaCf.status === 200, `got ${viaCf.status}`);
    const supabase2 = serviceClient();
    const { data: cfRows } = await supabase2
      .from("rate_limits")
      .select("ip_address, request_count")
      .in("ip_address", [VISITOR_C, CF_EDGE]);
    console.log(`   rows: ${JSON.stringify(cfRows)}`);
    check("row keyed by the visitor IP", (cfRows || []).some((r) => r.ip_address === VISITOR_C));
    check("NO row keyed by the Cloudflare edge IP",
      !(cfRows || []).some((r) => r.ip_address === CF_EDGE));

    console.log("\n5) shared DB limiter must be the one in use (no memory fallback)");
    const log = fs.readFileSync(LOG, "utf8");
    check("no 'Rate limiter DB unavailable' warnings", !log.includes("Rate limiter DB unavailable"));
    const supabase = serviceClient();
    const { data: rows } = await supabase
      .from("rate_limits")
      .select("ip_address, request_count, blocked_until")
      .in("ip_address", [VISITOR_A, VISITOR_B]);
    console.log(`   rows: ${JSON.stringify(rows)}`);
    check("both synthetic visitors recorded in rate_limits", (rows || []).length >= 2);
  } catch (err) {
    failures++;
    console.error("ERROR:", err.message);
  } finally {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { shell: true, stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
    await sleep(1500);
    await clearSyntheticRows(); // leave the shared table clean
    console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} ===`);
    process.exitCode = failures === 0 ? 0 : 1;
  }
})();

