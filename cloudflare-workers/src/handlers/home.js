import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

export async function handleHome(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCORSHeaders(env, request) });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
    });
  }

  try {
    const result = await cachedJson(
      request,
      env,
      async () => {
        const supabase = createSupabaseAdmin(env);

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

        // Transform products/categories/site_images similar to other handlers for frontend compatibility
        const products = (productsRes.data || []).map((product) => ({
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

        const categories = (categoriesRes.data || []).map((cat) => ({
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

        const siteImages = (siteImagesRes.data || []).map((img) => ({
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

        const featuredCategories = categories.filter((c) => c.is_featured);

        const payload = {
          products,
          categories,
          siteImages,
          slidingCards,
          featuredCategories,
          videos,
          testimonials,
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders(env, request),
          },
        });
      },
      { cacheControl: getCacheControl(env) }
    );
    return result;
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
    });
  }
}

