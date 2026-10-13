-- ========================================
-- COMPLETE DATABASE SCHEMA
-- Samar Store E-commerce Platform
-- Clean Version: 2026-02-09
-- ========================================

-- ========================================
-- 1. EXTENSIONS & CUSTOM TYPES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_type') THEN
    CREATE TYPE coupon_type AS ENUM ('percent', 'flat');
  END IF;
END $$;

-- ========================================
-- 2. TABLES
-- ========================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line TEXT NOT NULL,
  area TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_hint TEXT,
  link_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  featured_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  regular_price NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sub_category TEXT REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  image_alt TEXT,
  image_hint TEXT,
  tags TEXT[],
  inventory INTEGER DEFAULT 0,
  rating NUMERIC(4,2),
  review_count INTEGER DEFAULT 0,
  gallery_images TEXT[],
  allow_image_upload BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  image_attribution TEXT,
  license TEXT,
  material TEXT,
  color TEXT,
  color_options JSONB,
  options JSONB,
  variants JSONB,
  badge TEXT,
  specific_description TEXT,
  features TEXT[],
  weight_grams INTEGER,
  dimensions_length NUMERIC(6,2),
  dimensions_width NUMERIC(6,2),
  dimensions_height NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type coupon_type NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_order_id TEXT,
  transaction_id TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_email TEXT,
  status TEXT CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'RETURNED', 'REFUNDED')),
  subtotal_amount NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  advance_amount NUMERIC(12,2) DEFAULT 0,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  extra_note TEXT,
  payment_status TEXT,
  payment_method TEXT,
  return_reason TEXT,
  refund_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_phone);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  image_hint TEXT,
  customer_uploaded_images JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, product_id, sku)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  session_id TEXT,
  provider_order_id TEXT,
  transaction_id TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupon Redemptions Table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL REFERENCES coupons(code) ON DELETE RESTRICT,
  discount_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  admin_note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Uploads Storage
CREATE TABLE IF NOT EXISTS customer_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  google_drive_url TEXT,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('instagram', 'youtube')),
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sliding Cards
CREATE TABLE IF NOT EXISTS sliding_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_hint TEXT,
  link_url TEXT,
  order_num INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Images
CREATE TABLE IF NOT EXISTS site_images (
  id TEXT PRIMARY KEY,
  name TEXT,
  image_url TEXT NOT NULL,
  image_hint TEXT,
  description TEXT,
  link_url TEXT,
  button_text TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  content TEXT,
  image_url TEXT,
  image_key TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  rating NUMERIC(3, 2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_name TEXT,
  variable_names TEXT[],
  variables JSONB,
  recipients TEXT[],
  status TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_number TEXT NOT NULL,
  template_name TEXT,
  language_code TEXT,
  header_parameters JSONB,
  body_parameters JSONB,
  status TEXT,
  error TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abandoned Carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,
  cart_items JSONB NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  recovery_status TEXT DEFAULT 'pending' CHECK (recovery_status IN ('pending', 'reminder_sent', 'recovered', 'expired')),
  reminder_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead Analytics
CREATE TABLE IF NOT EXISTS lead_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  city TEXT,
  country TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  page_url TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'impression', 'form_submit')),
  element_selector TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auth Rate Limits
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  phone TEXT PRIMARY KEY,
  count INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

-- Site Settings (Single Row Table)
CREATE TABLE IF NOT EXISTS site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  contact_hours TEXT,
  maintenance_mode_enabled BOOLEAN DEFAULT FALSE,
  maintenance_mode_message TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  social_linkedin TEXT,
  social_twitter TEXT,
  home_meta_title TEXT,
  home_meta_description TEXT,
  google_verification_code TEXT,
  google_tag_manager_id TEXT,
  invoice_business_name TEXT,
  invoice_business_address TEXT,
  invoice_gst_number TEXT,
  invoice_phone TEXT,
  invoice_email TEXT,
  invoice_terms TEXT,
  invoice_logo_url TEXT,
  invoice_tax_percent NUMERIC(5,2),
  invoice_currency_symbol TEXT,
  expected_delivery_min_days INTEGER DEFAULT 7,
  expected_delivery_max_days INTEGER DEFAULT 15,
  free_shipping_threshold NUMERIC(12,2) DEFAULT 0,
  promo_banner_enabled BOOLEAN DEFAULT FALSE,
  promo_banner_title TEXT,
  promo_banner_subtitle TEXT,
  timer_banner_enabled BOOLEAN DEFAULT FALSE,
  timer_banner_title TEXT,
  timer_banner_end_date TIMESTAMPTZ,
  banner_effect TEXT,
  timer_banner_image_url TEXT,
  theme_background TEXT,
  theme_muted TEXT,
  theme_gradient TEXT,
  cart_abandonment_enabled BOOLEAN DEFAULT FALSE,
  cart_abandonment_delay_hours INTEGER DEFAULT 2,
  cart_abandonment_whatsapp_template TEXT,
  whatsapp_otp_template TEXT,
  hero_enabled BOOLEAN DEFAULT FALSE,
  hero_desktop_image_id TEXT,
  hero_mobile_image_id TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_button_text TEXT DEFAULT 'Shop Now',
  hero_button_link TEXT DEFAULT '/shop',
  bestsellers_enabled BOOLEAN DEFAULT TRUE,
  customer_login_enabled BOOLEAN DEFAULT FALSE,
  image_upload_provider TEXT DEFAULT 'supabase',
  owner_first_name TEXT,
  owner_last_name TEXT,
  product_id_prefix TEXT DEFAULT 'PR',
  whatsapp_only_checkout_enabled BOOLEAN DEFAULT FALSE,
  payment_gateway TEXT NOT NULL DEFAULT 'CASHFREE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (id)
);

-- Initialize Site Settings
INSERT INTO site_settings (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. FUNCTIONS & TRIGGERS
-- ========================================

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all relevant tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'customers', 'categories', 'products', 'coupons', 'videos', 
    'order_status_history', 'lead_analytics', 'payments', 'reviews', 
    'blog_posts', 'order_items', 'site_images', 'subscriptions',
    'marketing_campaigns', 'whatsapp_messages', 'site_settings', 
    'sliding_cards', 'abandoned_carts', 'customer_uploads', 'orders', 'customer_addresses',
    'testimonials'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE set_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- Order Status Management Function
CREATE OR REPLACE FUNCTION update_order_status(
    order_uuid UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL,
    admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
BEGIN
    SELECT status INTO current_status FROM orders WHERE id = order_uuid;
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF new_status NOT IN ('PENDING', 'PAID', 'CANCELLED', 'RETURNED', 'REFUNDED') THEN
        RAISE EXCEPTION 'Invalid status: %', new_status;
    END IF;
    UPDATE orders SET
        status = new_status,
        return_reason = CASE WHEN new_status = 'RETURNED' THEN reason ELSE return_reason END,
        refund_reason = CASE WHEN new_status = 'REFUNDED' THEN reason ELSE refund_reason END,
        admin_notes = COALESCE(admin_note, admin_notes),
        updated_at = NOW()
    WHERE id = order_uuid;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'customers', 'categories', 'products', 'coupons', 'videos', 
    'order_status_history', 'lead_analytics', 'payments', 'reviews', 
    'blog_posts', 'order_items', 'site_images', 'subscriptions',
    'marketing_campaigns', 'whatsapp_messages', 'site_settings', 
    'sliding_cards', 'abandoned_carts', 'customer_uploads', 'orders', 
    'customer_addresses', 'auth_rate_limits', 'testimonials'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Service Role Policies (Full Access)
CREATE POLICY service_role_all_customers ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_customer_addresses ON customer_addresses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_orders ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_order_items ON order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_payments ON payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_products ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_categories ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_site_settings ON site_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_site_images ON site_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_reviews ON reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_coupons ON coupons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_blog_posts ON blog_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_whatsapp ON whatsapp_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_subscriptions ON subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_analytics ON lead_analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_history ON order_status_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_uploads ON customer_uploads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_videos ON videos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_sliding ON sliding_cards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all_abandoned ON abandoned_carts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_manage_rate_limits ON auth_rate_limits FOR ALL USING (auth.role() = 'service_role');

-- Public Access Policies (Read Only)
CREATE POLICY public_view_products ON products FOR SELECT USING (TRUE);
CREATE POLICY public_view_categories ON categories FOR SELECT USING (TRUE);
CREATE POLICY public_view_site_settings ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY public_view_site_images ON site_images FOR SELECT USING (TRUE);
CREATE POLICY public_view_videos ON videos FOR SELECT USING (TRUE);
CREATE POLICY public_view_sliding_cards ON sliding_cards FOR SELECT USING (active = TRUE);
CREATE POLICY public_view_blog_posts ON blog_posts FOR SELECT USING (published_at IS NOT NULL AND published_at <= NOW());
CREATE POLICY public_view_reviews ON reviews FOR SELECT USING (is_approved = TRUE);
CREATE POLICY public_view_testimonials ON testimonials FOR SELECT USING (is_visible = TRUE);
CREATE POLICY service_role_all_testimonials ON testimonials FOR ALL USING (auth.role() = 'service_role');

-- Worker Access (Anon) for Addresses
CREATE POLICY worker_anon_manage_addresses ON customer_addresses
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Authenticated User Policies (Self Access)
CREATE POLICY users_view_own_addresses ON customer_addresses
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);

-- ========================================
-- 5. GRANTS
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON products, categories, site_settings, site_images, videos, sliding_cards, blog_posts, reviews, testimonials TO anon, authenticated;

-- Add COD (Cash on Delivery) settings columns to site_settings
-- Run this migration manually in Supabase Dashboard > SQL Editor

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cod_min_order_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cod_extra_fee NUMERIC(10,2) DEFAULT 0;

-- Enable COD with defaults
UPDATE site_settings SET cod_enabled = false WHERE cod_enabled IS NULL;

-- Categories Table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS size_guide_image_url TEXT DEFAULT NULL;

-- Product Questions Table
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product_id ON product_questions(product_id);

ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_updated_at_product_questions BEFORE UPDATE ON product_questions FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE POLICY service_role_all_product_questions ON product_questions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY public_insert_product_questions ON product_questions FOR INSERT WITH CHECK (true);
CREATE POLICY public_view_product_questions ON product_questions FOR SELECT USING (status = 'approved');
