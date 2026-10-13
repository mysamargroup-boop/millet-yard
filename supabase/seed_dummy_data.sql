-- ==========================================
-- SEED DUMMY DATA SCRIPT
-- ==========================================

-- 1. Site Settings (Ensure single row exists with valid data)
INSERT INTO site_settings (
  id,
  logo_url,
  contact_email,
  contact_phone,
  contact_address,
  contact_hours,
  maintenance_mode_enabled,
  home_meta_title,
  home_meta_description,
  expected_delivery_min_days,
  expected_delivery_max_days,
  free_shipping_threshold,
  promo_banner_enabled,
  promo_banner_title,
  promo_banner_subtitle,
  timer_banner_enabled,
  timer_banner_title,
  timer_banner_title
) VALUES (
  TRUE,
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=100&q=80',
  'hello@samarstore.com',
  '+91 98765 43210',
  '123 Artisan Street, Craftsville, India',
  'Mon - Fri: 9am - 6pm',
  FALSE,
  'Samar Store - Handcrafted Wooden Gifts',
  'Discover unique handcrafted wooden gifts, decor, and personalized items.',
  5,
  10,
  999,
  TRUE,
  'Summer Sale is Live!',
  'Get flat 20% off on all wooden lamps.',
  TRUE,
  'Flash Sale Ends In',
  'Flash Sale Ends In'
)
ON CONFLICT (id) DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  contact_email = EXCLUDED.contact_email,
  promo_banner_enabled = EXCLUDED.promo_banner_enabled;

-- 2. Categories
INSERT INTO categories (id, name, description, image_url, image_hint, is_featured, featured_order) VALUES
('cat_decor', 'Home Decor', 'Handcrafted wooden decor for your home.', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80', 'Wooden wall art', TRUE, 1),
('cat_kitchen', 'Kitchenware', 'Premium wooden bowls, plates, and cutlery.', 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=800&q=80', 'Wooden spoons and bowls', TRUE, 2),
('cat_gifts', 'Personalized Gifts', 'Custom engraved gifts for special occasions.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80', 'Engraved wooden plaque', TRUE, 3),
('cat_toys', 'Wooden Toys', 'Safe and eco-friendly wooden toys for kids.', 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&q=80', 'Wooden car toy', FALSE, 0),
('cat_office', 'Office & Desk', 'Elegant wooden organizers and accessories.', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80', 'Wooden desk organizer', FALSE, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO products (
  id, name, short_description, description, regular_price, sale_price, category_id, 
  image_url, inventory, rating, review_count, badge
) VALUES
('prod_lamp', 'Geometric Wooden Lamp', 'Modern geometric lamp shade.', 'A stunning geometric wooden lamp shade that creates beautiful shadow patterns.', 2999, 2499, 'cat_decor', 'https://images.unsplash.com/photo-1540932296757-ca128867a5b3?w=800&q=80', 50, 4.8, 12, 'Bestseller'),
('prod_bowl', 'Teak Wood Salad Bowl', 'Large hand-turned salad bowl.', 'Perfect for serving salads or fruits. Made from sustainable teak wood.', 1499, 1299, 'cat_kitchen', 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=800&q=80', 30, 4.9, 8, 'New'),
('prod_plaque', 'Custom Name Plaque', 'Personalized wooden name plate.', 'Engrave your name or a special message. Comes with wall mounting kit.', 999, 899, 'cat_gifts', 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80', 100, 5.0, 25, 'Trending'),
('prod_coaster', 'Resin & Wood Coasters', 'Set of 4 elegant coasters.', 'Combination of resin art and natural wood grain. Heat resistant.', 799, 599, 'cat_decor', 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80', 45, 4.7, 15, NULL),
('prod_truck', 'Wooden Toy Truck', 'Handcrafted toy truck.', 'Smooth finish, non-toxic polish. Safe for toddlers.', 1299, NULL, 'cat_toys', 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&q=80', 20, 4.6, 5, NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Site Images (Hero Slides & Banners)
INSERT INTO site_images (id, name, image_url, description, link_url, button_text, is_visible) VALUES
('hero-1', 'Hero Slide 1', 'https://images.unsplash.com/photo-1497215842964-222b4bef9720?w=1920&q=80', 'Elevate Your Home with Handcrafted Wood', '/shop', 'Shop Now', TRUE),
('hero-2', 'Hero Slide 2', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1920&q=80', 'The Perfect Gift is Personal', '/collections/cat_gifts', 'Customize Now', TRUE),
('banner-promo', 'Promo Banner', 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=1200&q=80', 'Special Festive Offer', '/shop', 'View Deals', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Sliding Cards (Mobile)
INSERT INTO sliding_cards (title, description, image_url, link_url, order_num, active) VALUES
('New Arrivals', 'Check out the latest additions', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', '/collections/new-arrivals', 1, TRUE),
('Best Sellers', 'Our most popular items', 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80', '/collections/bestsellers', 2, TRUE),
('Gift Guide', 'Curated gifts for everyone', 'https://images.unsplash.com/photo-1513201099747-3658bf603716?w=800&q=80', '/pages/gift-guide', 3, TRUE)
ON CONFLICT DO NOTHING; -- No ID specified, relies on auto-gen UUID, might duplicate if run multiple times without cleanup, but safe for 'add dummy data' request.

-- 6. Testimonials
INSERT INTO testimonials (customer_name, content, rating, is_visible) VALUES
('Rahul S.', 'Absolutely love the finish of the wooden bowl. It feels so premium!', 5, TRUE),
('Priya M.', 'Ordered a custom plaque for my office. The engraving detail is precise.', 5, TRUE),
('Amit K.', 'Great packaging and timely delivery. The lamp looks even better in person.', 4, TRUE),
('Sneha R.', 'A bit pricey but the quality justifies it. Will buy again.', 4, TRUE)
ON CONFLICT DO NOTHING;

-- 7. Videos (Artisans At Work)
INSERT INTO videos (id, type, url, thumbnail_url) VALUES
('vid_1', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'),
('vid_2', 'instagram', 'https://www.instagram.com/reel/123456', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- 8. Reviews (Linked to products)
INSERT INTO reviews (product_id, customer_name, rating, review_text, is_approved) VALUES
('prod_lamp', 'Vikram Singh', 5, 'Transforms the room ambiance completely.', TRUE),
('prod_bowl', 'Anjali D.', 5, 'Very sturdy and elegant.', TRUE),
('prod_plaque', 'Rohan G.', 4, 'Good quality wood.', TRUE)
ON CONFLICT DO NOTHING;

