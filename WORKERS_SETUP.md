# Cloudflare Workers Setup (Legacy Notes)

> **Note:** This file is kept as a high‑level pointer.  
> **Canonical docs are now in:** `cloudflare-workers/README.md` and `docs/DEPLOYMENT_GUIDE.md`.

---

## 📁 Where is the Workers code?

- `cloudflare-workers/src/index.js` – main router (entry point)
- `cloudflare-workers/src/handlers/*` – business logic (orders, products, coupons, auth, home bundle, etc.)
- `cloudflare-workers/src/utils/*` – CORS, Supabase client, edge cache, helpers
- `cloudflare-workers/wrangler.toml` – Worker config + envs

For full structure and endpoint list, see **`cloudflare-workers/README.md`**.

---

## ⚙️ Quick Setup (summary)

```bash
cd cloudflare-workers
npm install

# Local dev
npm run dev          # wrangler dev

# Deploy
npm run deploy:staging
npm run deploy:production
```

Configure environment/secrets via Cloudflare dashboard (or `wrangler secret put`), as described in:

- `cloudflare-workers/README.md`
- `docs/DEPLOYMENT_GUIDE.md`

---

## 🎨 Theme Notes (Mobile Nav Footer)

Admin Settings (`Site Settings` → Theme) control:

1. **Website Tone / Theme Gradient (`theme_gradient`)**
   - Drives overall “brand gradient” and the **mobile shop icon** background.
2. **Background (`theme_background`)**
   - Solid page background when gradient is not used.
3. **Muted Background (`theme_muted`)**
   - Secondary surface color (cards, subtle sections).

**Not themeable via DB (still code‑level):**

- Primary color (buttons, links, main accents)
- Accent color (sale badges, highlights)  
→ Change via Tailwind config / `globals.css` if needed.