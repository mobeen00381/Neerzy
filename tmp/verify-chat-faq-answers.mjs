// Live end-to-end check: the FAQ answers served by the real /api/chat route.
//
//   npm run dev          (in one terminal)
//   node tmp/verify-chat-faq-answers.mjs
//
// WHY: three different questions ("can i buy domain", "how website edit after
// building", "but local TLDs domain name?") used to come back as the SAME
// canned answer, because the static FAQ matcher returned the first entry whose
// keyword appeared anywhere in the message. This asserts the route now serves
// three distinct, correct answers.
const BASE = process.env.BASE_URL || "http://localhost:3000";
const questions = [
  "can i buy domain",
  "how website edit after building",
  "but local TLDs domain name?",
];

const answers = [];
for (const q of questions) {
  const r = await fetch(BASE + "/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
  });
  const j = await r.json().catch(() => ({}));
  answers.push({ q, status: r.status, reply: String(j.reply || JSON.stringify(j)) });
}

let pass = 0; const fails = [];
const check = (l, ok, d = "") => { if (ok) { pass++; console.log(`  PASS  ${l}`); } else { fails.push(`${l} — ${d}`); console.log(`  FAIL  ${l} — ${d}`); } };

for (const a of answers) {
  console.log(`\n  Q: ${a.q}\n  HTTP ${a.status} — ${a.reply.replace(/\n/g, " ").slice(0, 180)}…`);
}

check("all 3 answered 200", answers.every((a) => a.status === 200), answers.map((a) => a.status).join(","));
check("3 distinct answers", new Set(answers.map((a) => a.reply)).size === 3, `distinct=${new Set(answers.map((a) => a.reply)).size}/3`);
check("'can i buy domain' → domain copy", answers[0].reply.includes("$19") && answers[0].reply.includes("Build Website"));
check("'how website edit after building' → Website Editor", answers[1].reply.includes("Website Editor"));
check("'but local TLDs domain name?' → local TLD copy", answers[2].reply.includes(".co.uk") && answers[2].reply.includes("ABN"));
check("no repeat of the domain answer", answers[2].reply !== answers[0].reply);

console.log(`\n${fails.length ? "FAILURES" : "ALL GOOD"} — ${pass} passed, ${fails.length} failed`);
if (fails.length) process.exit(1);
