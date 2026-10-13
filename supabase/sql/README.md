# Supabase SQL Schema

This directory contains the complete database schema for Samar Store.

## Files

| File | Description |
|------|-------------|
| `01_schema.sql` | Complete database schema - extensions, types, all tables, indexes, functions, triggers |
| `02_rls_policies.sql` | Row Level Security policies for all tables |
| `README.md` | This file |

## How to Use

### Fresh Database Setup
Run files in order:
```sql
-- 1. First run the schema
\i 01_schema.sql

-- 2. Then run RLS policies
\i 02_rls_policies.sql
```

### Update RLS Only
If you need to update RLS policies without changing schema:
```sql
\i 02_rls_policies.sql
```

## Tables Overview (23 Tables)

### Core Tables
- `customers` - Customer data
- `categories` - Product categories
- `products` - Product catalog
- `tags` - Product tags
- `coupons` - Discount coupons

### Orders & Payments
- `orders` - Customer orders
- `order_items` - Order line items
- `payments` - Payment records
- `coupon_redemptions` - Coupon usage tracking
- `order_status_history` - Order status audit trail
- `customer_uploads` - Customer uploaded images

### Content
- `banners` - Homepage banners
- `videos` - Instagram/YouTube videos
- `sliding_cards` - Homepage sliding cards
- `site_images` - Site images library
- `blog_posts` - Blog articles
- `reviews` - Product reviews

### Settings
- `site_settings` - Site configuration (single row)
- `public_site_settings` - View with non-sensitive settings only

### Marketing
- `abandoned_carts` - Cart recovery tracking
- `subscriptions` - Newsletter subscriptions
- `marketing_campaigns` - Campaign management
- `whatsapp_messages` - WhatsApp message logs
- `lead_analytics` - Visitor analytics

## RLS Policy Summary

| Table | Anon | Auth | Service |
|-------|------|------|---------|
| categories | ✅ Read | ✅ Read | ✅ Full |
| products | ✅ Read | ✅ Read | ✅ Full |
| tags | ✅ Read | ✅ Read | ✅ Full |
| coupons | ⚠️ Active only | ⚠️ Active only | ✅ Full |
| customers | ❌ | ⚠️ Own only | ✅ Full |
| orders | ❌ | ⚠️ Own only | ✅ Full |
| order_items | ❌ | ⚠️ Own only | ✅ Full |
| banners | ⚠️ Active + Date | ⚠️ Active + Date | ✅ Full |
| videos | ✅ Read | ✅ Read | ✅ Full |
| sliding_cards | ✅ Read | ✅ Read | ✅ Full |
| site_images | ✅ Read | ✅ Read | ✅ Full |
| blog_posts | ✅ Read | ✅ Read | ✅ Full |
| reviews | ⚠️ Approved only | ⚠️ Approved only | ✅ Full |
| site_settings | ✅ Read | ✅ Read | ✅ Full |
| customer_uploads | ✅ Insert/Read | ✅ Insert/Read | ✅ Full |
| payments | ❌ | ❌ | ✅ Full |
| coupon_redemptions | ❌ | ❌ | ✅ Full |
| order_status_history | ❌ | ❌ | ✅ Full |
| abandoned_carts | ❌ | ❌ | ✅ Full |
| subscriptions | ❌ | ❌ | ✅ Full |
| marketing_campaigns | ❌ | ❌ | ✅ Full |
| whatsapp_messages | ❌ | ❌ | ✅ Full |
| lead_analytics | ❌ | ❌ | ✅ Full |

**Legend:**
- ✅ Full access
- ⚠️ Conditional access
- ❌ No access

## Sensitive Data Handling

The `site_settings` table contains some sensitive columns:
- `invoice_*` - Business invoice details
- `cart_abandonment_*` - WhatsApp automation
- `image_upload_provider` - Storage configuration

Use `public_site_settings` view for client-side access to avoid exposing sensitive data.
