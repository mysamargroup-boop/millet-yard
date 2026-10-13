# API Routes vs Workers (Single Source of Truth)

## 📌 Goal

**Abhi (Vercel free plan):** Public operations **Workers** se chalenge (Vercel API invocation save)  
**Future (VPS):** `NEXT_PUBLIC_USE_NEXTJS_API=true` karke public operations **Next.js API** pe switch

**Switch:** `NEXT_PUBLIC_USE_NEXTJS_API`
- `true` → Next.js API
- anything else (`false` / undefined) → Workers (default)

---

## ✅ Workers Functions (Jab `NEXT_PUBLIC_USE_NEXTJS_API !== 'true'`)

### Public endpoints (frontend se direct)

| Feature | Worker Endpoint | Source |
|---------|------------------|--------|
| Products | `/api/products` | `src/config/api.ts` → `API.PRODUCTS` |
| Categories | `/api/categories` | `src/config/api.ts` → `API.CATEGORIES` |
| Order Create (COD + Prepaid) | `/api/orders/create` | `CheckoutModal.tsx`, `payment.ts` → `API.ORDER_CREATE_URL` |
| Coupons (validate/list) | `/api/coupons` / `/api/coupons/validate` | `src/config/api.ts` → `API.COUPONS_ADMIN` |
| Chat | `/api/chat` | `src/config/api.ts` → `API.CHAT` |

### Proxy routes (Next.js → Worker forward)

Ye routes Next.js me rahenge, but internally Worker ko hit karte hain:

| Next.js Route | Worker Endpoint | Notes |
|-------------|------------------|------|
| `/api/order-status` | `/api/orders/status` | order status check |
| `/api/auth/otp/request` | `/api/auth/otp` | OTP request |
| `/api/auth/otp/verify` | `/api/auth/otp` | OTP verify |
| `/api/account/addresses` | `/api/account/addresses` | customer addresses |
| `/api/account/profile` | `/api/account/profile` | customer profile |
| `/api/whatsapp/send` | `/api/send-whatsapp` | WhatsApp send |
| `/api/webhooks/payment` | `/api/webhooks/cashfree` | payment webhook |

**Important:** Agar `NEXT_PUBLIC_WORKER_URL` set nahi hai, to ye proxies fail ho sakte hain.

---

## 🔄 Next.js API Routes (Always present)

### Admin routes (always Next.js, admin auth required)

| Feature | API Route |
|--------|-----------|
| Admin login | `/api/auth/admin-login` |
| Admin verify | `/api/auth/admin-verify` |
| Admin logout | `/api/auth/admin-logout` |
| Admin CRUD (products, categories, coupons, etc.) | `/api/*` (protected via `requireAdminAuth`) |

### Public fallback (only when Worker URL not used)

| Feature | API Route | When used |
|--------|-----------|-----------|
| Order create fallback | `/api/orders` (POST) | jab Worker direct call configured nahi hai |

---

## 🔀 Switch Logic (env)

### Current (Workers mode)

```env
NEXT_PUBLIC_USE_NEXTJS_API=false
NEXT_PUBLIC_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

### Future (VPS / Next.js API mode)

```env
NEXT_PUBLIC_USE_NEXTJS_API=true
NEXT_PUBLIC_WORKER_URL=  # optional
```

---

## 🚀 Worker Deploy + Test (quick)

```bash
cd cloudflare-workers
npm run deploy:production
```

```bash
# Deployed worker test
node test-worker.js https://your-worker.your-subdomain.workers.dev
```

Local dev:

```bash
npm run dev
npm run test:local
```

---

## ✅ Checklist (Workers mode)

- [ ] `NEXT_PUBLIC_USE_NEXTJS_API` is `false` (or unset)
- [ ] `NEXT_PUBLIC_WORKER_URL` set
- [ ] Worker secrets/vars set (Supabase/Cashfree/etc.)
- [ ] CORS allowed origin set (production)
- [ ] Test: products fetch + order create
