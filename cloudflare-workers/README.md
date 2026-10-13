# Cloudflare Workers - Shop API

## 📋 Overview

Ye Cloudflare Worker backend API hai jo shop ke saare public operations handle karta hai:
- Products & Categories
- Order creation (COD + Prepaid)
- Payment gateway integration (Cashfree)
- Customer authentication (OTP)
- Coupons validation
- Chatbot
- Webhooks
- Analytics

---

## 🚀 Quick Start

### Prerequisites

1. **Cloudflare Account** - Cloudflare dashboard access
2. **Node.js** - LTS recommended
3. **Wrangler CLI** - Recommended via project dependency (`npm install`), or global install if you prefer
4. **Login** - `wrangler login`

### Install (recommended)

```bash
cd cloudflare-workers
npm install
```

### Local dev env (recommended)

Create a local vars file for `wrangler dev`:

```bash
copy .dev.vars.example .dev.vars
```

---

## ☁️ Cloudflare Dashboard Setup (must do once)

### 1) Create the Worker

- Cloudflare Dashboard → **Workers & Pages** → **Create** → **Worker**
- Worker name recommended:
  - Production: `shop-api-production`
  - Staging: `shop-api-staging`

> Note: `wrangler.toml` already defines `env.production` and `env.staging`.  
> So `wrangler deploy --env production` will deploy `shop-api-production`, etc.

### 2) Set Variables & Secrets

You can set these either via:
- **Dashboard** → Worker → **Settings** → **Variables**
- or via **Wrangler** (recommended for secrets)

**Required variables (non-secret ok):**
- `SUPABASE_URL`
- `CASHFREE_APP_ID`
- `CASHFREE_ENV` (`SANDBOX` / `PRODUCTION`)
- `ALLOWED_ORIGIN` (comma-separated allowed frontend origins for production CORS)

**Required secrets (always secret):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `CASHFREE_SECRET_KEY`

**Admin API protection (recommended):**
- Secret `API_KEY` (used as `X-API-Key` for admin endpoints)

**Optional (only if used):**
- `GEMINI_API_KEY` (chat)
- `EMAIL_API_KEY` / SMTP vars (email)

**Wrangler secrets (per environment):**

```bash
# Production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
wrangler secret put CASHFREE_SECRET_KEY --env production
wrangler secret put API_KEY --env production

# Staging
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging
wrangler secret put CASHFREE_SECRET_KEY --env staging
wrangler secret put API_KEY --env staging
```

### 3) (Optional) KV for rate limiting

`src/utils/helpers.js` has an optional KV-based rate-limit helper (`env.KV`).  
If you want it:

- Dashboard → **Workers & Pages** → **KV** → create a namespace
- Bind it to the Worker as variable name: `KV`
- Then add the KV binding id in `wrangler.toml` (`kv_namespaces` comment is already present)

### 4) CORS / Domains

- Production CORS restricts to `ALLOWED_ORIGIN` list (see `src/utils/cors.js`)
- Worker URL will be available as `https://<worker-name>.<your-subdomain>.workers.dev`
- If you want custom domain, configure **Domains & Routes** in Worker settings

### Environment Variables

Worker ke liye environment variables `wrangler.toml` me set karein ya Cloudflare Dashboard se:

```toml
[vars]
ENVIRONMENT = "production"
SUPABASE_URL = "your-supabase-url"
CASHFREE_APP_ID = "your-cashfree-app-id"
CASHFREE_ENV = "SANDBOX" # or "PRODUCTION"
ALLOWED_ORIGIN = "https://your-frontend-domain.com"
```

**Secrets** (sensitive keys) Cloudflare Dashboard se set karein:
```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
wrangler secret put CASHFREE_SECRET_KEY --env production
```

---

## 📦 Deployment

### Option 1: Using npm script (Recommended)

```bash
# Production
npm run deploy:production

# Staging
npm run deploy:staging

# Default (production)
npm run deploy
```

### Option 2: Using Node script

```bash
node deploy.js production
node deploy.js staging
```

### Option 3: Direct wrangler

```bash
npm run deploy:direct
# or
wrangler deploy
```

---

## 🧪 Testing

### Test deployed Worker

```bash
# Test production Worker (set WORKER_URL in env or pass as arg)
WORKER_URL=https://your-worker.workers.dev node test-worker.js

# Or pass URL as argument
node test-worker.js https://your-worker.workers.dev
```

### Test local Worker (dev mode)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test local Worker
npm run test:local
```

---

## 📁 Project Structure

```
cloudflare-workers/
├── src/
│   ├── index.js              # Main router (entry point)
│   ├── handlers/             # Route handlers
│   │   ├── orders.js        # Order creation, payment
│   │   ├── products.js       # Products & categories
│   │   ├── auth.js          # OTP authentication
│   │   ├── coupons.js       # Coupon validation
│   │   ├── chat.js          # AI chatbot
│   │   ├── webhooks.js      # Payment webhooks
│   │   └── ...
│   └── utils/               # Utilities
│       ├── cors.js          # CORS headers
│       ├── supabase.js      # Supabase client
│       └── helpers.js       # Helper functions
├── deploy.js                # Deploy script
├── test-worker.js           # Test script
├── wrangler.toml            # Worker configuration
└── package.json             # Dependencies
```

---

## 🔄 API Endpoints

### Public Endpoints (No Auth)

| Endpoint | Method | Handler | Description |
|----------|--------|---------|-------------|
| `/api/products` | GET | `handleProducts` | List all products |
| `/api/categories` | GET | `handleCategories` | List all categories |
| `/api/site-settings` | GET | `handleSiteSettings` | Get site settings |
| `/api/site-images` | GET | `handleSiteImages` | Get site images |
| `/api/sliding-cards` | GET | `handleSlidingCards` | Get sliding cards |
| `/api/blog` | GET | `handleBlogPosts` | Get blog posts |
| `/api/reviews` | GET | `handleReviews` | Get reviews |

### Order Endpoints

| Endpoint | Method | Handler | Description |
|----------|--------|---------|-------------|
| `/api/orders/create` | POST | `handleCreateOrder` | Create order (COD + Prepaid) |
| `/api/orders/status` | POST | `handleOrderStatus` | Get order status |
| `/api/create-payment` | POST | `handleCreatePayment` | Create payment (legacy) |

### Auth Endpoints

| Endpoint | Method | Handler | Description |
|----------|--------|---------|-------------|
| `/api/auth/otp` | POST | `handleAuthRequest` | OTP request/verify |

### Admin Endpoints (Require X-API-Key)

| Endpoint | Method | Handler | Description |
|----------|--------|---------|-------------|
| `/api/admin/orders` | POST | `handleOrdersAdmin` | Admin order operations |
| `/api/admin/products` | POST | `handleProductsAdmin` | Admin product operations |
| `/api/admin/coupons` | GET/POST | `handleCouponsAdmin` | Admin coupon operations |
| `/api/site-settings` | POST | `handleSiteSettings` | Update site settings |
| `/api/site-images` | POST | `handleSiteImages` | Update site images |
| `/api/sliding-cards` | POST/DELETE | `handleSlidingCards` | Manage sliding cards |
| `/api/analytics/leads` | GET | `handleLeadAnalytics` | Lead analytics |

---

## 🔐 Authentication

### Admin Endpoints

Admin endpoints require `X-API-Key` header:
```
X-API-Key: your-api-key-from-env
```

Set in `wrangler.toml` or Cloudflare Dashboard:
```toml
[vars]
API_KEY = "your-secret-api-key"
```

### Public Endpoints

Public endpoints (products, categories, etc.) don't require authentication.

---

## 🌐 CORS Configuration

CORS headers automatically added by `getCORSHeaders()` utility.

**Allowed Origins** (configured in `utils/cors.js`):
- `http://localhost:3000` (development)
- `https://business.woody.co.in` (production)
- `https://shop-cloud.pages.dev` (staging)
- Custom origins from `ALLOWED_ORIGIN` env var

---

## 📝 Notes

### Old Backup Files

- `src/index.js.bak` - Old monolithic backup (outdated)
- `src/oldbak.js` - Old backup file (outdated)

**Current code:** `src/index.js` (modular, up-to-date)

### Environment Variables

**Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`

**Optional:**
- `CASHFREE_ENV` (default: `SANDBOX`)
- `API_KEY` (for admin endpoints)
- `ALLOWED_ORIGIN` (CORS)
- `PUBLIC_URL` (CORS fallback)

---

## 🔧 Troubleshooting

### Deployment fails

1. Check if logged in: `wrangler whoami`
2. Check `wrangler.toml` syntax
3. Verify environment variables are set

### CORS errors

1. Check `ALLOWED_ORIGIN` in env vars
2. Verify frontend origin is in allowed list
3. Check `utils/cors.js` configuration

### Worker not responding

1. Check Worker logs: `wrangler tail`
2. Verify environment variables
3. Test locally: `npm run dev`

---

## 📚 Related Documentation

- [API Routes vs Workers](../docs/API_ROUTES_VS_WORKERS.md)
- [Order Flow](../docs/ORDER_FLOW.md)
- [Security Fixes](../SECURITY_FIXES_BEFORE_AFTER.md)
