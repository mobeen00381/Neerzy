# WhatsApp Template Fix - Marketing Category Resubmission

## Problem
The `review_request_utility` template was rejected with reason: **"Not recommended category"**

Meta considers review requests as **Marketing** (promotional) rather than **Utility** (transactional).

---

## ✅ Solution: Resubmit as Marketing Category

### Step 1: Edit Existing Template
1. Go to: **https://business.facebook.com/latest/whatsapp_manager/message_templates**
2. Find `review_request_utility`
3. Click **"Edit template"**

### Step 2: Change Category
| Field | Change To |
|-------|-----------|
| **Category** | `MARKETING` ← Change from UTILITY |
| **Subcategory** | `PROMOTION` or leave blank |
| **Template Name** | Keep `review_request_utility` OR change to `review_request` |

### Step 3: Keep Same Content
```
Hi {{1}},

Thank you for choosing {{2}}! We'd really appreciate it if you could leave us a quick review.

Review link: {{3}}

It helps us grow!
```

### Step 4: Resubmit
Click **"Submit"** or **"Send for Review"**

---

## ⏰ Expected Timeline

- **Marketing template approval:** 24-48 hours (sometimes faster)
- **Status:** Pending → Approved

---

##  Alternative: Create New Marketing Template

If editing doesn't work, create a new one:

**Template Name:** `review_request`

**Category:** `MARKETING`

**Subcategory:** `PROMOTION`

**Body:** (same as above)

---

## 📊 Why Marketing Category?

Meta's classification:
- **Utility** = Transaction-specific (order confirmation, shipping update, appointment reminder)
- **Marketing** = Business promotion (reviews, offers, newsletters, announcements)

Review requests help your business reputation = **Marketing**

---

## ✅ Code Status

**No code changes needed!** The code already uses:
```typescript
const templateName = process.env.META_TEMPLATE_REVIEW_REQUEST || 'review_request_utility';
```

Whether you use `review_request_utility` or `review_request`, just update the `.env.local` and Vercel environment variable to match.

---

## 🧪 After Approval

1. ✅ Template status shows **"Approved"**
2. ✅ Add `META_TEMPLATE_REVIEW_REQUEST` to Vercel Production
3. ✅ Test sending review request from dashboard
4. ✅ Check Vercel logs for delivery confirmation

---

**Last Updated:** August 23, 2026  
**Status:** Waiting for category correction and resubmission