# 🧶 Samar Store / Shop-Cloud

> **Last updated:** 2026-02-11  
> Edge‑first e‑commerce: Next.js (App Router) + Cloudflare Workers + Supabase.

---

## 🔭 High‑level Overview

- **Frontend:** Next.js 15 App Router, Tailwind, Lucide icons  
- **Backend:** Cloudflare Workers (Router + modular handlers)  
- **Database:** Supabase (PostgreSQL + RLS)  
- **Auth (Admin):** HttpOnly JWT cookie + `requireAdminAuth` middleware  
- **Payments:** Cashfree  
- **Messaging:** WhatsApp Cloud API

---

## 🌐 API Routing Model

**Switch:** `NEXT_PUBLIC_USE_NEXTJS_API`

- `false` / unset → **Workers mode (recommended on Vercel free)**
  - Public flows (products, categories, coupons, chat, homepage data, order create)  
    → **Client → Cloudflare Worker → Supabase**
  - Admin flows  
    → Next.js API (server) → Supabase service role
- `true` → **Next.js API mode (for VPS)**
  - Public + admin flows run via Next.js API routes  
  - Workers remain optional for some proxies/webhooks

**Docs:** see `docs/API_ROUTES_VS_WORKERS.md`.

---

## 🏠 Homepage Behaviour (Performance)

- **Single bundled call:**  
  - Client calls `/api/home` (or Worker `/api/home`) → returns:
    - `products`, `categories`, `siteImages`, `slidingCards`,
    - `featuredCategories`, `videos`, `testimonials`
- **Edge caching:** Worker endpoints for catalog/content are cached at Cloudflare edge.
- **Skeleton loading:**  
  - Homepage shows grey “shimmer” skeletons for hero, grids, and product cards while data loads.
- **Direct DB calls from browser:** avoided for homepage in Workers mode.

More details: `docs/ORDER_FLOW.md`, `docs/WORKERS_SECURITY_ANALYSIS.md`.

---

## 🔒 Security & Admin

Key fixes (see `ADMIN_SECURITY_ISSUES.md`, `SECURITY_FIXES_APPLIED.md`, `SECURITY_FIXES_BEFORE_AFTER.md`):

- Admin credentials moved to **server‑only envs** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`)
- All admin API routes protected via `requireAdminAuth`
- Admin UI guarded by `src/middleware.ts` (server‑side)
- Cloudflare Workers admin endpoints protected via `X-API-Key`
- Basic rate limiting for:
  - OTP login
  - Orders create (Worker)
  - Chat (Worker)

---

## 📂 Important Docs

- `docs/API_ROUTES_VS_WORKERS.md` – Where API routes vs Workers are used
- `docs/ORDER_FLOW.md` – COD + prepaid flow (including Worker order create)
- `docs/DEPLOYMENT_GUIDE.md` – Vercel + Cloudflare Workers deployment
- `docs/WORKERS_SECURITY_ANALYSIS.md` – Worker security + rate limiting notes
- `cloudflare-workers/README.md` – Worker‑specific setup, deploy, and testing
- `WORKERS_SETUP.md` – Legacy notes, now pointing to the above

---

## 🧑‍💻 Local Development

```bash
# 1. Install deps
npm install

# 2. Create .env.local from .env.example and fill keys

# 3. Run Next.js app
npm run dev

# 4. In another terminal, run Workers locally (optional)
cd cloudflare-workers
npm install
npm run dev
```

---

## ⚖️ License

Proprietary – internal use for Samar / Shop‑Cloud only.
