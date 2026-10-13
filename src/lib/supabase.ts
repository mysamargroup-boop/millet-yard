import { createClient } from '@supabase/supabase-js'
import type { Category, Product, Review, SiteImage, SlidingCard, SiteSettings, Testimonial } from './types'
import { API } from '@/config/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for browser/client-side use (for non-sensitive data)
export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const createSupabaseAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service credentials not found. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Singleton instances (lazy initialization)
export const supabase = () => createSupabaseClient()
export const supabaseAdmin = () => createSupabaseAdminClient()

// Provides a client, falling back to anonymous if admin credentials are not set
export const getClientWithFallback = () => {
  try {
    return supabaseAdmin();
  } catch (error) {
    console.warn('Falling back to anonymous Supabase client limit access.');
    return supabase();
  }
}

// In-memory cache
let cache = {
  products: null as Product[] | null,
  categories: null as Category[] | null,
  siteImages: null as SiteImage[] | null,
  slidingCards: null as SlidingCard[] | null,
  videos: null as any[] | null,
  testimonials: null as Testimonial[] | null,
}

function getLocalCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.t || !parsed?.v) return null
    if (Date.now() - parsed.t > ttlMs) return null
    return parsed.v as T
  } catch {
    return null
  }
}

function setLocalCache(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }))
  } catch {
    // ignore storage errors
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  if (typeof window === 'undefined' && url.startsWith('/')) {
    throw new Error(`Server-side relative URL not supported for fetch: ${url}`);
  }
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`)
  return (await res.json()) as T
}

async function getCachedFetch<T>(cacheKey: string, url: string, ttlMs: number): Promise<T> {
  // in-memory first
  const mem = (cache as any)[cacheKey]
  if (mem) return mem as T

  const storageKey = `home:${cacheKey}:v3_shreeanna`

  // localStorage next (fast paint on reload)
  if (typeof window !== 'undefined') {
    const local = getLocalCache<T>(storageKey, ttlMs)
    if (local) {
      ; (cache as any)[cacheKey] = local
      // background refresh (best-effort)
      fetchJson<T>(url).then((fresh) => {
        ; (cache as any)[cacheKey] = fresh
        setLocalCache(storageKey, fresh)
      }).catch(() => { })
      return local
    }
  }

  const fresh = await fetchJson<T>(url)
    ; (cache as any)[cacheKey] = fresh
  if (typeof window !== 'undefined') setLocalCache(storageKey, fresh)
  return fresh
}

export type HomeBundle = {
  products: Product[]
  categories: Category[]
  siteImages: SiteImage[]
  slidingCards: SlidingCard[]
  featuredCategories: Category[]
  videos: any[]
  testimonials: Testimonial[]
}

export async function getHomeBundle(): Promise<HomeBundle> {
  if (API?.HOME) {
    try {
      // SWR cache TTL: 5 minutes (instant client paint with background revalidation)
      const data = await getCachedFetch<HomeBundle>('homeBundle', API.HOME, 5 * 60 * 1000)
      // Ensure every product has a 'category' field (Worker API may only have 'category_id')
      if (data?.products) {
        data.products = data.products.map((p: any) => ({
          ...p,
          category: p.category || p.category_id || null,
        }))
      }
      return data
    } catch (e) {
      console.warn('Worker API fetch failed for homeBundle, falling back to direct Supabase:', e)
      // Fall through to direct Supabase queries below
    }
  }
  // Fallback: build locally from Supabase
  const [products, categories, siteImages, slidingCards, videos, testimonials] = await Promise.all([
    getProductsDirect(),
    getCategoriesDirect(),
    getSiteImagesDirect(),
    getSlidingCardsDirect(),
    getVideosDirect(),
    getTestimonialsDirect(),
  ])
  return {
    products,
    categories,
    siteImages,
    slidingCards,
    featuredCategories: categories.filter(c => (c as any).is_featured),
    videos,
    testimonials,
  }
}

// Direct client-side functions for non-sensitive data
export async function getSiteImagesDirect(): Promise<SiteImage[]> {
  if (cache.siteImages) return cache.siteImages;

  // Prefer Worker/Next API endpoint (edge cached) if configured
  if (typeof window !== 'undefined' && API?.SITE_IMAGES) {
    try {
      const result = await getCachedFetch<SiteImage[]>('siteImages', API.SITE_IMAGES, 5 * 60 * 1000)
      cache.siteImages = result
      return result
    } catch (e) {
      console.warn('API fetch failed for siteImages, falling back to direct DB', e)
    }
  }

  const client = supabase()
  const { data, error } = await client
    .from('site_images')
    .select('*')
    .order('id')

  if (error) throw error
  const result = (data || []).map((img: any) => ({
    id: img.id,
    name: img.name,
    description: img.description,
    imageUrl: img.image_url,
    imageHint: img.image_hint,
    linkUrl: img.link_url,
    buttonText: img.button_text,
    isVisible: img.is_visible
  }))
  cache.siteImages = result;
  return result;
}

export async function getSlidingCardsDirect(): Promise<SlidingCard[]> {
  if (cache.slidingCards) return cache.slidingCards;

  if (typeof window !== 'undefined' && API?.SLIDING_CARDS) {
    try {
      const result = await getCachedFetch<SlidingCard[]>('slidingCards', API.SLIDING_CARDS, 5 * 60 * 1000)
      cache.slidingCards = result
      return result
    } catch (e) {
      console.warn('API fetch failed for slidingCards, falling back to direct DB', e)
    }
  }

  const client = supabase()
  const { data, error } = await client
    .from('sliding_cards')
    .select('*')
    .eq('active', true)
    .order('order_num')

  if (error) throw error
  const result = data || [];
  cache.slidingCards = result;
  return result;
}

export async function getCategoriesDirect(): Promise<Category[]> {
  if (cache.categories) return cache.categories;

  if (typeof window !== 'undefined' && API?.CATEGORIES) {
    try {
      const result = await getCachedFetch<Category[]>('categories', API.CATEGORIES, 10 * 60 * 1000)
      cache.categories = result
      return result
    } catch (e) {
      console.warn('API fetch failed for categories, falling back to direct DB', e)
    }
  }

  const client = supabase()
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  const result = (data || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    imageUrl: cat.image_url || 'https://placehold.co/96x96?text=Category',
    imageHint: cat.image_hint || '',
    linkUrl: cat.link_url || null,
    is_featured: cat.is_featured || false,
    featured_order: cat.featured_order || 0,
    is_trending: cat.is_trending || false,
  }));
  cache.categories = result;
  return result;
}

export async function getProductsDirect(): Promise<Product[]> {
  if (cache.products) return cache.products;

  if (typeof window !== 'undefined' && API?.PRODUCTS) {
    try {
      const result = await getCachedFetch<Product[]>('products', API.PRODUCTS, 2 * 60 * 1000)
      cache.products = result
      return result
    } catch (e) {
      console.warn('API fetch failed for products, falling back to direct DB', e)
    }
  }

  const client = supabase()
  const { data, error } = await client
    .from('products')
    .select('*, sub_category_data:categories!products_sub_category_fkey(name)')
    .not('id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  const result = (data || []).map((product: any) => ({
    ...product,
    imageUrl: product.image_url,
    imageAlt: product.image_alt,
    imageHint: product.image_hint,
    galleryImages: product.gallery_images,
    videoUrl: product.video_url,
    imageAttribution: product.image_attribution,
    allowImageUpload: product.allow_image_upload,
    specificDescription: product.specific_description,
    reviewCount: product.review_count,
    price: product.sale_price || product.regular_price,
    regularPrice: product.regular_price ?? undefined,
    salePrice: product.sale_price ?? undefined,
    category: product.category_id,
    subCategory: product.sub_category_data?.name || null,
    shortDescription: product.short_description,
    colorOptions: product.color_options || [],
  }));
  cache.products = result;
  return result;
}

export async function getReviewsDirect(productId?: string): Promise<Review[]> {
  // Prefer API/Worker endpoint when available to avoid direct client→DB calls
  if (API?.REVIEWS) {
    try {
      const url = productId ? `${API.REVIEWS}?product_id=${encodeURIComponent(productId)}` : API.REVIEWS
      const data = await getCachedFetch<Review[]>('reviews', url, 2 * 60 * 1000)
      return (data || []).map((r: any) => ({
        ...r,
        author_name: r.customer_name ?? r.author_name,
        is_verified: r.is_approved ?? r.is_verified,
      }))
    } catch (e) {
      console.warn('API fetch failed for reviews, falling back to direct DB', e)
    }
  }

  const client = supabase()
  let query = client
    .from('reviews')
    .select('*')
    .eq('is_approved', true)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((r: any) => ({
    ...r,
    author_name: r.customer_name,
    is_verified: r.is_approved
  }))
}

export async function getVideosDirect() {
  if (cache.videos) return cache.videos;

  if (process.env.NEXT_PUBLIC_WORKER_URL) {
    try {
      const url = (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/videos'
      const result = await getCachedFetch<any[]>('videos', url, 10 * 60 * 1000)
      cache.videos = result
      return result
    } catch (e) {
      console.warn('Worker API fetch failed for videos, falling back to direct DB', e)
    }
  }

  const client = supabase()
  const { data, error } = await client
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  const result = data || [];
  cache.videos = result;
  return result;
}

export async function getTestimonialsDirect(): Promise<Testimonial[]> {
  if (cache.testimonials) return cache.testimonials;

  if (process.env.NEXT_PUBLIC_WORKER_URL) {
    try {
      const url = (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/testimonials'
      const result = await getCachedFetch<Testimonial[]>('testimonials', url, 10 * 60 * 1000)
      cache.testimonials = result
      return result
    } catch (e) {
      console.warn('Worker API fetch failed for testimonials, falling back to direct DB', e)
    }
  }

  const client = supabase()
  const { data, error } = await client
    .from('testimonials')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  const result = data || [];
  cache.testimonials = result;
  return result;
}

// Site settings - client side wrapper
export async function getSiteSettingsDirect(): Promise<SiteSettings> {
  // Site settings contain public data, can be fetched via API route or just client
  // But original code used /api/site-settings for consistency or service role?
  // Let's stick to API route as it might have some sensitive handling?
  // Actually, usually site settings are public. But logic in data-client-direct used /api/site-settings
  try {
    // We can use the toggle here too!
    // We can use the toggle here too!
    // But this is async import inside function...
    // Let's just fetch from /api/site-settings which will redirect/handle based on implementation
    // OR just use client.from('site_settings').select('*').single() 
    // The previous implementation used fetch, let's keep it safe.
    const response = await fetch('/api/site-settings');
    if (!response.ok) {
      throw new Error('Failed to fetch site settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return {} as SiteSettings;
  }
}

// Featured categories (filtered from categories)
export async function getFeaturedCategoriesDirect(): Promise<Category[]> {
  const categories = await getCategoriesDirect()
  return categories.filter(cat => cat.is_featured)
}

// Validate coupon using Supabase RPC (secure - doesn't expose all coupons)
export async function validateCouponDirect(couponCode: string, subtotal: number): Promise<{
  code?: string;
  discountAmount: number;
  type?: string;
  value?: number;
  message?: string;
  error?: string;
}> {
  const client = supabase()
  const { data, error } = await client.rpc('validate_coupon', {
    coupon_code: couponCode.trim().toUpperCase(),
    subtotal: subtotal || 0
  })

  if (error) {
    return { error: error.message, discountAmount: 0 }
  }

  // RPC returns JSON, parse it
  const result = typeof data === 'string' ? JSON.parse(data) : data

  if (result?.error) {
    return { error: result.error, discountAmount: 0 }
  }

  return {
    code: result?.code,
    discountAmount: Number(result?.discountAmount || 0),
    type: result?.type,
    value: result?.value,
    message: result?.message
  }
}
