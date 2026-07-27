# BUG #1 — WhatsApp Template Compliance Investigation

## 1. Where Outbound WhatsApp Messages Are Sent

There are **5 distinct locations** where Twilio `messages.create()` is called:

| # | File | Function | Line(s) | Purpose |
|---|------|----------|---------|---------|
| 1 | `src/app/api/whatsapp/webhook/route.ts` | `sendTwilioMessage()` | 567-586 | Generic free-form reply to trader (confirmations, instructions, errors) |
| 2 | `src/app/api/whatsapp/webhook/route.ts` | `sendTwilioTemplate()` | 588-606 | **Template-based** review request to customer |
| 3 | `src/app/api/whatsapp/webhook/route.ts` | `sendTwilioMedia()` | 608-626 | Free-form media message (photos with caption) to trader |
| 4 | `src/app/api/jobs/mark-published/route.ts` | inline | 93-98 | **Template-based** review request to customer |
| 5 | `src/app/api/jobs/mark-published/route.ts` | inline | 112-116 | Free-form **SMS** (not WhatsApp) backup to customer |
| 6 | `src/app/api/whatsapp/send-gmb-action/route.ts` | inline | 78-82 | Free-form WhatsApp message to customer |
| 7 | `src/app/api/whatsapp/inbound/route.ts` | `sendTwilioMessage()` | 44, 57, 92, 112 | Free-form replies to trader (via `@/lib/twilio.ts`) |
| 8 | `src/lib/twilio.ts` | `sendTwilioMessage()` | 21-25 | Generic sandbox-only sender (uses hardcoded `+14155238886`) |

---

## 2. Template vs Free-Form Analysis

### ✅ CORRECTLY USING TEMPLATES (Approved)

**Review Request to Customer** (2 locations):
- `webhook/route.ts` line 524-536 — `sendTwilioTemplate()` with `contentSid: HX36dc564715671fad2b3617c795984ee2`
- `mark-published/route.ts` line 86-98 — Same template SID `HX36dc564715671fad2b3617c795984ee2`

Both use `contentSid` + `contentVariables` — this is the **correct** way to send WhatsApp Business API messages outside the 24-hour session window.

### ❌ FREE-FORM MESSAGES (Potentially Non-Compliant)

**All other outbound messages use `body` directly without `contentSid`:**

| Message Type | Sent To | File | Risk |
|-------------|---------|------|------|
| "✅ *{type} saved.*\n\n{instructions}" | **Trader** (inbound sender) | `webhook/route.ts` line 119 | ✅ **LOW** — Trader initiated the conversation, so within 24h window |
| "⚠️ *No active draft found.*" | **Trader** | `webhook/route.ts` line 267 | ✅ LOW — Reply to trader's POST command |
| "⚠️ *No images found.*" | **Trader** | `webhook/route.ts` line 271 | ✅ LOW — Reply to trader's POST command |
| "📸 *Photos sent above...*" | **Trader** | `webhook/route.ts` line 314 | ✅ LOW — Part of POST flow initiated by trader |
| "📋 *Copy Post Text below:*" | **Trader** | `webhook/route.ts` line 340 | ✅ LOW — Part of POST flow |
| "🌐 *Open GBP directly...*" | **Trader** | `webhook/route.ts` line 364 | ✅ LOW — Part of POST flow |
| "👉 *Or manage via Dashboard:*" | **Trader** | `webhook/route.ts` line 379 | ✅ LOW — Part of POST flow |
| "❌ Error: {msg}" | **Trader** | `webhook/route.ts` line 388 | ✅ LOW — Error response to trader's action |
| "⚠️ *No pending post found.*" | **Trader** | `webhook/route.ts` line 442 | ✅ LOW — Reply to trader's DONE command |
| "⚠️ *No customer phone...*" | **Trader** | `webhook/route.ts` line 448 | ✅ LOW — Reply to trader's DONE command |
| "⚠️ *Customer phone matches your own*" | **Trader** | `webhook/route.ts` line 514 | ✅ LOW — Reply to trader's DONE command |
| "✅ *Review request sent to {name}!*" | **Trader** | `webhook/route.ts` line 556 | ✅ LOW — Confirmation to trader |
| "🌟 Thanks! Share your experience..." | **Trader** | `inbound/route.ts` line 44 | ✅ LOW — Reply to trader's PUBLISHED command |
| "❌ Invalid format..." | **Trader** | `inbound/route.ts` line 57 | ✅ LOW — Reply to trader's JOB command |
| "✅ Draft Ready!\n📝 {title}..." | **Trader** | `inbound/route.ts` line 92 | ✅ LOW — Reply to trader's JOB command |
| "⚠️ System error..." | **Trader** | `inbound/route.ts` line 112 | ✅ LOW — Error response |
| "🚀 {businessName} Update:\n\n{aiMsg}" | **Customer** | `send-gmb-action/route.ts` line 78-82 | 🔴 **HIGH** — Sent to **customer**, not trader. No template used. |
| "Hi {name}! 👋\n\nThank you for choosing..." | **Customer** (SMS) | `mark-published/route.ts` line 109 | ✅ N/A — This is SMS, not WhatsApp. SMS has no template requirement. |

---

## 3. 24-Hour Customer Service Window Analysis

### The Critical Distinction

WhatsApp Business API rules:
- **Free-form messages** can only be sent to a user **within 24 hours** of the last message they sent to the business (the "customer service window").
- **Outside the 24h window**, you MUST use an **approved template** (`contentSid`).

### Current Flow Assessment

**Messages to the TRADER (the business owner):**
- ✅ **All safe.** Every free-form message to the trader is a direct reply to a message the trader just sent (POST, DONE, PUBLISHED, JOB commands, or sending photos/text). These are all within the 24-hour window because the trader initiated the conversation.

**Messages to the CUSTOMER (the end client):**
- ✅ **Review request via template** — Correctly uses `contentSid` (template `HX36dc564715671fad2b3617c795984ee2`). This is the right approach since the customer may not have messaged the business recently.
- 🔴 **`send-gmb-action/route.ts` line 78-82** — Sends a **free-form** message to the customer (not the trader). This is **high risk** because:
  - The customer may not have an active 24-hour session
  - The message uses `body` directly, not `contentSid`
  - If the customer hasn't messaged the business recently, this will fail with **Error 63016** (no session window) or **Error 63020** (template required)

---

## 4. Template Compliance Gap Summary

### Messages That NEED Template Conversion

| Message | Sent To | Current Method | Risk | Recommended Action |
|---------|---------|---------------|------|-------------------|
| "🚀 {businessName} Update:\n\n{aiMsg}" | **Customer** | Free-form `body` | 🔴 **HIGH** — Will fail outside 24h window | Convert to approved template OR only send within 24h of customer's last message |
| "Hi {name}! 👋\n\nThank you for choosing..." | **Customer** (SMS) | SMS `body` | ✅ **NONE** — SMS has no template requirement | No action needed |

### Templates Currently Registered

Based on the code, only **one template** is in use:

| Template SID | Purpose | Status |
|-------------|---------|--------|
| `HX36dc564715671fad2b3617c795984ee2` | Review request (3 variables: customer name, business name, review link) | ✅ In use, appears approved |

### Templates That Need to Be Created/Submitted to Meta

If the business wants to send proactive messages to customers (outside the 24h window), the following templates would be needed:

| Template Purpose | Variables Needed | Priority |
|-----------------|-----------------|----------|
| **Post/Update notification** | Business name, update text, link | 🔴 HIGH (for `send-gmb-action/route.ts`) |
| **Photo saved confirmation** | Business name | 🟡 LOW (only sent to trader, always within window) |
| **Post generated confirmation** | Business name, headline | 🟡 LOW (only sent to trader, always within window) |

---

## 5. Summary

| Aspect | Status |
|--------|--------|
| **Review request to customer** | ✅ **Compliant** — Uses approved template `HX36dc564715671fad2b3617c795984ee2` |
| **All messages to trader** | ✅ **Compliant** — All are replies within active 24h session window |
| **Backup SMS to customer** | ✅ **N/A** — SMS has no template requirement |
| **`send-gmb-action` to customer** | 🔴 **NON-COMPLIANT** — Free-form message to customer without template. Will fail with Error 63016/63020 if customer has no active session. |
| **Template count** | **1 template** registered (`HX36dc564715671fad2b3617c795984ee2`). Need at least 1 more for proactive customer outreach. |
