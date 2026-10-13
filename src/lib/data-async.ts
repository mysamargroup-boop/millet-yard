

'use server';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, Order, Review, SiteImageData } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { API_ENDPOINTS } from '@/config/api';
import { getCachedData, setCachedData } from './redis';

// Import from Supabase instead of JSON files
import {
  getProducts as getProductsFromSupabase,
  getProductById as getProductByIdFromSupabase,
  getProductByName as getProductByNameFromSupabase,
  getOrders as getOrdersFromSupabase,
  getBlogPosts as getBlogPostsFromSupabase,
  getBlogPostsAdmin as getBlogPostsAdminFromSupabase,
  getTags as getTagsFromSupabase,
  getSiteImages as getSiteImagesFromSupabase,
  getCategories as getCategoriesFromSupabase,
  getReviewsByProductId as getReviewsByProductIdFromSupabase
} from './data-supabase';

import { slugify } from './utils';
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES, getDummyProductBySlug } from './dummy-data';

// Note: All data now comes from database, no JSON files used

// This function now uses the Supabase client with Redis + Worker fallback
export async function getCategories(): Promise<Category[]> {
  noStore();

  // 1. Try Redis Cache
  const cacheKey = 'categories';
  try {
    const cached = await getCachedData(cacheKey);
    if (cached && cached.length > 0) return cached;
  } catch {
  }

  // 2. Direct Supabase
  const categories = await getCategoriesFromSupabase();

  // 3. If DB is empty, return dummy categories
  if (!categories || categories.length === 0) {
    return DUMMY_CATEGORIES;
  }

  return categories;
}

export async function getAdminCategories(): Promise<Category[]> {
  noStore();
  // Bypass cache, strict admin fetch
  const { getAdminCategories } = await import('./data-supabase');
  return getAdminCategories();
}

export async function getProducts(): Promise<Product[]> {
  noStore();

  // 1. Try Redis Cache
  const cacheKey = 'products';
  try {
    const cached = await getCachedData(cacheKey);
    if (cached && cached.length > 0) return cached;
  } catch {
  }

  // 2. Direct Supabase
  const { products } = await getProductsFromSupabase();

  // 3. If DB is empty, return dummy products
  if (!products || products.length === 0) {
    return DUMMY_PRODUCTS;
  }

  return products;
}

export async function getOrders(): Promise<Order[]> {
  noStore();
  return getOrdersFromSupabase();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  noStore();
  const res = await getProductByIdFromSupabase(id);
  return res ?? undefined;
}

export async function getProductByName(name: string): Promise<Product | undefined> {
  noStore();

  // 1. Try database first
  const dbProduct = await getProductByNameFromSupabase(name);
  if (dbProduct) return dbProduct;

  // 2. If not in DB, check if ANY real products exist
  const { products: allProducts } = await getProductsFromSupabase();
  if (allProducts && allProducts.length > 0) {
    // Real products exist — don't show dummies
    return undefined;
  }

  // 3. DB is empty, try dummy data (match by slug)
  return getDummyProductBySlug(name);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  noStore();
  return getBlogPostsFromSupabase();
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  noStore();
  return getBlogPostsAdminFromSupabase();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  noStore();
  const posts = await getBlogPostsFromSupabase();
  return posts.find(post => post.slug === slug);
}

export async function getTags(): Promise<string[]> {
  try {
    const tags = await getTagsFromSupabase();
    return tags || [];
  } catch (error) {
    console.error('[ServerAction] getTags failed:', error);
    return [];
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  // 1. Try Redis Cache first
  const cacheKey = 'site-settings';
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch { }

  // 2. Direct Supabase query (no JSON file)
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('site_settings')
      .select(`
        id,
        logo_url,
        contact_email,
        contact_phone,
        contact_address,
        contact_hours,
        maintenance_mode_enabled,
        maintenance_mode_message,
        social_facebook,
        social_instagram,
        social_youtube,
        social_linkedin,
        social_twitter,
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
        timer_banner_end_date,
        banner_effect,
        timer_banner_image_url,
        theme_background,
        theme_muted,
        whatsapp_only_checkout_enabled,
        product_id_prefix,
        created_at,
        updated_at
      `)
      .maybeSingle();

    if (!error && data) {
      // Cache for 10 minutes
      await setCachedData(cacheKey, data, 600).catch(() => { });
      return data;
    }
  } catch (error) {
    console.error('Error fetching site settings:', error);
  }

  return {};
}


export async function getSiteImages(): Promise<SiteImageData> {
  noStore();
  // Use database via imported function
  return getSiteImagesFromSupabase();
}

// Samples feature deprecated - returns empty array
export async function getSamples(): Promise<any[]> {
  noStore();
  return [];
}


export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product: Product) => ({
    categoryName: slugify(product.category.split(',')[0].trim()),
    productName: slugify(product.name),
  }));
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  noStore();
  return getReviewsByProductIdFromSupabase(productId);
}

export async function getHomeBundleServer(): Promise<import('./types').HomeBundle> {
  const { getHomeBundleServer: fetchBundle } = await import('./data-supabase');
  return fetchBundle();
}
