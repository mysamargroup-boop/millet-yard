import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * /api/home
 *
 * Used when `NEXT_PUBLIC_USE_NEXTJS_API=true` (VPS mode).
 * Returns a single bundled payload for homepage to avoid multiple client requests.
 *
 * NOTE: In Vercel free plan (Workers mode), frontend should call Worker `/api/home` directly.
 */
export async function GET() {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase');
    const supabase = createSupabaseAdminClient();

    const [
      productsRes,
      categoriesRes,
      siteImagesRes,
      slidingCardsRes,
      videosRes,
      testimonialsRes,
    ] = await Promise.all([
      supabase.from('products').select('*').not('id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('site_images').select('*').order('id'),
      supabase.from('sliding_cards').select('*').eq('active', true).order('order_num'),
      supabase.from('videos').select('*').order('created_at', { ascending: false }),
      supabase.from('testimonials').select('*').eq('is_visible', true).order('created_at', { ascending: false }),
    ]);

    const firstError =
      productsRes.error ||
      categoriesRes.error ||
      siteImagesRes.error ||
      slidingCardsRes.error ||
      videosRes.error ||
      testimonialsRes.error;
    if (firstError) throw firstError;

    const products = (productsRes.data || []).map((product: any) => ({
      ...product,
      imageUrl: product.image_url || null,
      imageAlt: product.image_alt || product.name,
      imageHint: product.image_hint || '',
      regularPrice: product.regular_price || product.price || 0,
      salePrice: product.sale_price || null,
      shortDescription: product.short_description || '',
      specificDescription: product.specific_description || '',
      galleryImages: product.gallery_images || [],
      reviewCount: product.review_count || 0,
      category: product.category_id || null,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    const categories = (categoriesRes.data || []).map((cat: any) => ({
      ...cat,
      imageUrl: cat.image_url || null,
      imageHint: cat.image_hint || '',
      linkUrl: cat.link_url || null,
      is_featured: cat.is_featured || false,
      featured_order: cat.featured_order || 0,
      is_trending: cat.is_trending || false,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    }));

    const siteImages = (siteImagesRes.data || []).map((img: any) => ({
      id: img.id,
      key: img.key,
      name: img.name,
      imageUrl: img.image_url || null,
      imageHint: img.image_hint || '',
      linkUrl: img.link_url || null,
      type: img.type || 'image',
      createdAt: img.created_at,
      updatedAt: img.updated_at,
    }));

    const slidingCards = slidingCardsRes.data || [];
    const videos = videosRes.data || [];
    const testimonials = testimonialsRes.data || [];
    const featuredCategories = categories.filter((c: any) => c.is_featured);

    const res = NextResponse.json({
      products,
      categories,
      siteImages,
      slidingCards,
      featuredCategories,
      videos,
      testimonials,
    });

    // VPS mode caching can be handled by reverse proxy/CDN; keep conservative default
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to build home payload' }, { status: 500 });
  }
}

