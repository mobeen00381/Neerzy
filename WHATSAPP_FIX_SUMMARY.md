# 🚨 WhatsApp Message Delivery Fix Summary

## ✅ What Was Fixed

### 1. **Database Schema** (Completed)
- Added all 11 missing columns to `review_requests` table in Supabase
- Migration file created at `supabase/migrations/20260720_create_review_requests.sql`

### 2. **WhatsApp Delivery Fallback Logic** (Implemented)
Modified 3 files to support **dual-path delivery**:

#### Files Updated:
- **`src/app/api/reviews/send-request/route.ts`**
  - First attempts: Approved Meta template
  - Falls back to: Free-form text message (works within 24h customer window)
  - Logs detailed success/failure via `sent_via` field: `'whatsapp_template'`, `'whatsapp_fallback'`, or fails

- **`src/app/api/whatsapp/webhook/route.ts`** 
  - Same dual-path logic for webhook-triggered reviews
  - Updates `sent_via` to track which method succeeded

- **`src/app/api/debug/template-test/route.ts`** (New version)
  - Test both template AND fallback methods
  - Provides debug hints based on error codes

#### Environment Variables Required:
```bash
META_WHATSAPP_ACCESS_TOKEN=EAATpXm6GBQUB...
META_TEMPLATE_REVIEW_REQUEST=review_request
META_WHATSAPP_PHONE_NUMBER_ID=1256240127573258
```

All configured in `.env.local` ✅

---

## 📋 Next Steps for You

### Step 1: Verify Vercel Production Env Vars
Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Ensure these are set in **Production** (not just Development):
- ✅ `META_WHATSAPP_ACCESS_TOKEN`
- ✅ `META_TEMPLATE_REVIEW_REQUEST`  
- ✅ `META_WHATSAPP_PHONE_NUMBER_ID`

If missing, add them and redeploy.

---

### Step 2: Check Meta Template Status

Your template MUST be **APPROVED** before using templates for delivery.

1. Go to: https://business.facebook.com/business/YOUR_BUSINESS_ID/messaging/templates
2. Look for `review_request` template
3. Check status = **Approved**

#### If NOT approved yet:
You can still use **fallback messaging** (free-form text), which works if:
- Customer contacted you within last 24 hours (via webhook)
- This happens automatically when template delivery fails

#### If you need pre-approved templates only:
Create template in Meta Business Manager:
```
Template Name: review_request

Language: English (US)

Category: UTILITY

Components:

Header: None

Body Text:
Hi {{1}}! 👋

Thank you for choosing {{2}}! We'd really appreciate it if you could leave us a quick review.

🔗 Review link: {{3}}

It helps us grow! 🙏

Buttons: None

Quick Replies: None
```

After creation: Click **Submit for Approval** → Wait 24-72 hours for approval.

---

### Step 3: Test Delivery

#### Option A: Manual Test
Visit: `https://neerzy.com/api/debug/template-test` (POST request)

Payload:
```json
{
  "phoneNumber": "+923206291617",
  "testName": "fallback"
}
```

This tests free-form delivery (no template approval needed).

#### Option B: Use Your App
1. Create a job completion in your Neerzy app
2. Add customer phone number and name
3. Submit review request
4. Watch Vercel logs for messages like:
   ```
   ✅ Review request sent via Meta WhatsApp TEMPLATE to [name] at +92...
   OR
   📩 FALLBACK: Sending free-form WhatsApp message...
   ✅ FALLBACK MESSAGE SENT successfully! Message ID: ...
   ```

#### Option C: Check Logs
In Vercel Dashboard:
1. Deployments → Latest Deployment
2. View Function Logs
3. Search for keywords:
   - `"✅ Review request"`
   - `"❌ Template failed:"`
   - `"FALLBACK:"`

---

## 🔍 Common Error Messages & Fixes

| Error Code | Error Message | Cause | Solution |
|-----------|--------------|-------|----------|
| **60200** | `TEMPLATE_NOT_APPROVED` | Template not yet approved | Use fallback (auto-enabled) or submit template for approval |
| **unauthorized** / **Access token invalid** | Token expired | Access token needs refresh | Generate new Page Access Token from Meta Business Suite |
| **invalid_id** | Phone number ID wrong | META_WHATSAPP_PHONE_NUMBER_ID incorrect | Verify at https://developers.facebook.com/docs/whatsapp/cloud-api/webhook |
| **63016** | No session window | Trying template outside 24h window | Use approved template (no session required) |
| **No free-form message sent** | Outside 24h window | Customer hasn't messaged recently | Either get customer to message you first OR wait for template approval |

---

## 🎯 Expected Behavior After This Fix

1. **User clicks "Send Review Request"**
2. **System saves to Supabase** ✅ (always succeeds now)
3. **Tries Meta Template**
   - ✅ Success → Sends immediately, logged as `whatsapp_template`
   - ❌ Fail → Automatically tries fallback
4. **Fallback Message**
   - ✅ Success (if customer contacted within 24h) → Logged as `whatsapp_fallback`
   - ❌ Fail → Still saved in Supabase, user notified via email/dashboard
5. **Logs show exact method used** in Vercel function logs

---

## 🧪 Quick Test Commands

```bash
# Test fallback message (works without template approval)
curl -X POST https://neerzy.com/api/debug/template-test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+923206291617","testName":"fallback"}'

# Test template (requires approved template)
curl -X POST https://neerzy.com/api/debug/template-test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+923206291617","testName":"template"}'
```

---

## ✨ Summary

- ✅ Database schema fixed
- ✅ WhatsApp delivery now has smart fallback logic
- ✅ All environment variables configured in `.env.local`
- ✅ Detailed logging added for debugging
- ⏳ **Action needed**: Ensure Vercel production env vars are set
- ⏳ **Optional**: Create/approve Meta template for best UX

Your app should now start sending WhatsApp messages! Even if templates aren't approved yet, the fallback mechanism ensures customers still receive requests when possible. 🚀
