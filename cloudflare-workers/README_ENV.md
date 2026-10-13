# Cloudflare Workers Environment Setup Guide

Is guide mein bataya gaya hai ki `cloudflare-workers` folder ke liye environment variables aur secrets kaise setup karein.

## 1. Environment Variables (Public/Non-Sensitive)
Ye variables `wrangler.toml` file mein `[vars]` ya `[env.production.vars]` section mein hote hain. Inhe change karne ke baad worker ko fir se deploy karna padta hai.

**File:** `wrangler.toml`
```toml
[vars]
ENVIRONMENT = "production"
SMTP_HOST = "smtp.example.com"
SMTP_PORT = "587"
FROM_EMAIL = "noreply@yourdomain.com"
CONNECT_WHATSAPP = "91XXXXXXXXXX" # Test OTP ke liye
NEXT_PUBLIC_SITE_URL = "https://your-site.com"
```

**Deploy Command:**
```bash
wrangler deploy
```

## 2. Secrets (Sensitive/Encrypted)
Secrets encrypted hote hain aur inhe `wrangler.toml` mein nahi likha jata. Inhe CLI ke zariye Cloudflare par upload kiya jata hai.

**Commands to add Secrets:**
Run these commands one by one in your terminal:

```bash
# Supabase Setup
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Authentication & Security
wrangler secret put API_KEY
wrangler secret put OTP_SECRET

# Payments (Cashfree)
wrangler secret put CASHFREE_APP_ID
wrangler secret put CASHFREE_SECRET_KEY
wrangler secret put CASHFREE_CLIENT_SECRET

# Messaging
wrangler secret put WHATSAPP_ACCESS_TOKEN
wrangler secret put WHATSAPP_PHONE_NUMBER_ID
wrangler secret put SLACK_WEBHOOK_URL

# AI (Optional)
wrangler secret put GEMINI_API_KEY
```

## 3. Local Development (`.dev.vars`)
Local testing ke liye, ek `.dev.vars` file banayein `cloudflare-workers` root folder mein:

```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
API_KEY=your_admin_api_key
OTP_SECRET=some_random_secret
```

Ab aap `wrangler dev` se local test kar sakte hain.

---
**Note:** Agar aapne `--env production` use karke deploy kiya hai, toh secrets add karte waqt bhi `--env production` flag lagana hoga (e.g., `wrangler secret put API_KEY --env production`).
