# Site Images Table — Database Entry Guide

The `site_images` table in Supabase controls various homepage visuals like the Spotlight section, Promo Slider, Dual Banner, and more. Each component filters entries by the `id` prefix.

---

## Table: `site_images`

| Column        | Type      | Required | Description |
|---------------|-----------|----------|-------------|
| `id`          | `text`    | ✅ Yes   | Unique ID with a **prefix** that determines which section uses this image. See prefix rules below. |
| `name`        | `text`    | ✅ Yes   | Display title (e.g., "Summer Sale Banner") |
| `description` | `text`    | No       | Description or subtitle text |
| `image_url`   | `text`    | ✅ Yes   | Full URL to the image (use Cloudinary/CDN for best performance) |
| `image_hint`  | `text`    | No       | Hint text for accessibility |
| `link_url`    | `text`    | No       | URL where the image links to when clicked |
| `key`         | `text`    | No       | Additional identifier key |
| `type`        | `text`    | No       | Content type (default: `"image"`) |
| `is_visible`  | `boolean` | No       | Set to `false` to hide without deleting |
| `button_text` | `text`    | No       | Button/CTA text (used by Spotlight for author name) |
| `created_at`  | `timestamp` | Auto  | Auto-generated |
| `updated_at`  | `timestamp` | Auto  | Auto-generated |

---

## ID Prefix Rules

The homepage components filter `site_images` by the **`id` prefix**. The prefix determines which section uses the image.

| Prefix           | Component         | Description |
|------------------|-------------------|-------------|
| `spotlight-`     | Spotlight Section | Testimonial/feature cards with image + text side-by-side |
| `promo-`         | Promo Slider      | Full-width promotional banners |
| `dual-banner-`   | Dual Banner       | Two landscape images side-by-side |
| `hero-`          | Hero Section      | Main hero banner at the top |

---

## Example Entries

### Spotlight Entry
```
id:          spotlight-1
name:        Lemon Pickle
description: The lemon pickle tastes truly homemade...
image_url:   https://res.cloudinary.com/.../spotlight1.jpg
link_url:    /shop/lemon-pickle
button_text: Aniruddha Tewari    ← This shows as the author name
is_visible:  true
```

### Promo Banner Entry
```
id:          promo-summer-sale
name:        Summer Sale 2026
description: Up to 50% off on all items
image_url:   https://res.cloudinary.com/.../summer-sale.jpg
link_url:    /shop?discount=50
is_visible:  true
```

### Dual Banner Entry
```
id:          dual-banner-left
name:        New Arrivals
image_url:   https://res.cloudinary.com/.../arrivals.jpg
link_url:    /shop?sort=newest
is_visible:  true
```

---

## How to Add a New Entry (Supabase Dashboard)

1. Go to **Supabase Dashboard** → **Table Editor** → **site_images**
2. Click **Insert Row**
3. Fill in the fields:
   - Set `id` with the correct **prefix** (e.g., `spotlight-my-review`)
   - Set `image_url` to your image CDN link
   - Set `is_visible` to `true`
4. Click **Save**
5. The image will appear on the homepage after the next page load (or after cache expires)

---

## Component Data Flow

```
Supabase (site_images table)
    ↓
Worker API / Next.js API (/api/home)
    ↓
getHomeBundle() in src/lib/supabase.ts
    ↓
HomeClient.tsx → passes siteImages to:
    ├── SpotlightSection (filters by id.startsWith('spotlight-'))
    ├── PromoSlider (filters by id.startsWith('promo-'))
    ├── DualBanner (filters by id.startsWith('dual-banner-'))
    └── HeroSection (filters by id.startsWith('hero-'))
```
