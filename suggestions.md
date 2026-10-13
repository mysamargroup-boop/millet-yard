# 🛍️ Shop-Cloud Technical Roadmap

## 🏗️ Architecture
- **API Mode**: Switchable via `NEXT_PUBLIC_USE_NEXTJS_API` (True = Next.js, False = Workers).
- **Data Fetching**: Unified `/api/home` bundle for homepage performance.
- **Caching**: Edge caching enabled for Workers; local dev bypasses cache for stability.

## ✅ Completed (Recently)
- [x] **Skeleton Loading**: Homepage and product grids use skeleton UI.
- [x] **API Caching**: Cloudflare Edge caching for catalog data.
- [x] **Security Refactor**: JWT + HttpOnly cookies for admin routes.
- [x] **PWA Fix**: Manifest file syntax corrected.
- [x] **Schema Sync**: Site settings API fixed (removed missing DB columns).

## 🔥 High Priority Tasks
- [ ] **UI Consistency**: Audit Search and Tag pages to match new Category styling.
- [ ] **Admin Abandoned Carts**: Create a dashboard view for `abandoned_carts` table.
- [ ] **Fix Placeholder Images**: Replace Unsplash 404 links in `site_images` and `categories` tables.

## ⚡ Medium Priority Tasks
- [ ] **Virtual Scrolling**: Implement `react-window` for large product grids.
- [ ] **Data Layer Cleanup**: Consolidate `data.ts`, `data-async.ts`, and `data-client-direct.ts`.
- [ ] **Audit Logs**: Implement server-side logging for admin actions.

## 🧊 Future Features
- [ ] **Advanced Search**: MeiliSearch or Algolia integration.
- [ ] **Automated Tests**: Jest for units, Playwright for E2E.
- [ ] **Loyalty Program**: Points system for customers.
