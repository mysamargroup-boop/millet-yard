# Deployment Guide - Workers vs API Routes

## 🎯 Current Setup (Abhi Workers Use Hone Chahiye)

**Default:** Workers functions use hote hain jab `NEXT_PUBLIC_USE_NEXTJS_API` set nahi hai ya `false` hai.

---

## 📋 Step-by-Step Deployment

### 1. Cloudflare Worker Deploy

```bash
cd cloudflare-workers

# Option 1: Using npm script (recommended)
npm run deploy:production

# Option 2: Using Node script
node deploy.js production

# Option 3: Direct wrangler
wrangler deploy --env production
```

**Output:** Worker URL milega, e.g. `https://shop-api.your-subdomain.workers.dev`

### 2. Environment Variables Set Karo

**Vercel / `.env.local`:**
```env
# Workers use karne ke liye (default)
NEXT_PUBLIC_USE_NEXTJS_API=false
# Ya isko set hi mat karo

# Worker URL (required)
NEXT_PUBLIC_WORKER_URL=https://shop-api.your-subdomain.workers.dev
```

### 3. Test Karo

```bash
# Worker test
cd cloudflare-workers
node test-worker.js https://shop-api.your-subdomain.workers.dev

# Ya local dev server se
npm run test:local
```

### 4. Frontend Test

```bash
# Next.js dev server start karo
npm run dev

# Browser me test karo:
# - Products load ho rahe hain?
# - Order create ho raha hai?
# - Payment flow kaam kar raha hai?
```

---

## 🔄 Future: VPS pe Switch Karne Ke Liye

Jab VPS use karna ho, tab:

### 1. Environment Variable Change

```env
# VPS mode - Next.js API routes use honge
NEXT_PUBLIC_USE_NEXTJS_API=true

# Worker URL optional (proxy routes ke liye)
NEXT_PUBLIC_WORKER_URL=https://shop-api.your-subdomain.workers.dev
```

### 2. Kya Change Hoga

- ✅ Products/Categories → Next.js `/api/products`, `/api/categories`
- ✅ Order Create → Next.js `/api/orders` (POST)
- ✅ Chat → Next.js `/api/chat`
- ✅ Coupons → Next.js `/api/coupons`
- ✅ Admin routes → Same (Next.js API routes)

**Note:** Proxy routes (`/api/create-payment-link`, `/api/order-status`, etc.) ab bhi Workers ko call kar sakte hain agar `WORKER_URL` set ho.

---

## ✅ Checklist

### Abhi (Workers Mode)

- [ ] Worker deployed hai
- [ ] `NEXT_PUBLIC_WORKER_URL` set hai
- [ ] `NEXT_PUBLIC_USE_NEXTJS_API` false hai ya undefined
- [ ] Worker test pass ho raha hai
- [ ] Frontend se order create ho raha hai
- [ ] Products load ho rahe hain

### Future (VPS Mode)

- [ ] `NEXT_PUBLIC_USE_NEXTJS_API=true` set kiya
- [ ] Next.js API routes test kiye
- [ ] Admin panel kaam kar raha hai
- [ ] Order flow test kiya

---

## 🐛 Common Issues

### Worker deploy fails

**Error:** `Missing SUPABASE_URL`
**Fix:** `wrangler.toml` me vars check karo ya Cloudflare Dashboard se set karo

### CORS errors

**Error:** `Access-Control-Allow-Origin`
**Fix:** `utils/cors.js` me frontend origin add karo

### Order create fails

**Error:** `Worker URL not configured`
**Fix:** `.env` me `NEXT_PUBLIC_WORKER_URL` set karo

---

## 📞 Support

- Worker logs: `wrangler tail`
- Local dev: `npm run dev` (cloudflare-workers folder me)
- Test script: `node test-worker.js`
