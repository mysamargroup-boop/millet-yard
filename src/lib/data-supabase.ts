

'use server';
import { supabaseAdmin, supabase, getClientWithFallback } from './supabase';
import type { Category, Product, ProductsData, BlogPost, SiteSettings, SiteImage, Video, Review, SlidingCard, Testimonial, HomeBundle } from './types';
import { slugify } from './utils';
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES } from './dummy-data';

export async function getCategories(): Promise<Category[]> {
  try {
    let client;
    try {
      client = getClientWithFallback();
    } catch (err) {
      // Fallback: Return empty if client fails (e.g. missing keys)
      return [];
    }

    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('name');


    if (error) throw error;
    return (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.image_url || '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
      imageHint: cat.image_hint || '',
      linkUrl: cat.link_url || null,
      is_featured: cat.is_featured || false,
      featured_order: cat.featured_order || 0,
      size_guide_image_url: cat.size_guide_image_url || null,
      is_trending: cat.is_trending || false,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getAdminCategories(): Promise<Category[]> {
  try {
    const client = getClientWithFallback();
    if (!client) {
      console.error('CRITICAL: Supabase Admin client failed in getAdminCategories. Check SUPABASE_SERVICE_ROLE_KEY.');
      console.error('Environment check - NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error('Environment check - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      // Return empty array instead of throwing, so the page doesn't crash 500.
      return [];
    }

    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('[getAdminCategories] Supabase query error:', error);
      throw error;
    }

    return (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.image_url || '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
      imageHint: cat.image_hint || '',
      linkUrl: cat.link_url || null,
      is_featured: cat.is_featured || false,
      featured_order: cat.featured_order || 0,
      is_trending: cat.is_trending || false,
    }));
  } catch (error) {
    console.error('[getAdminCategories] Error fetching admin categories:', error);
    return []; // Return empty to prevent crash, but logs will show why.
  }
}

export async function getProducts(): Promise<ProductsData> {
  try {
    const client = getClientWithFallback();
    const { data, error } = await client
      .from('products')
      .select('*, sub_category_data:categories!products_sub_category_fkey(name)')
      .not('id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform snake_case to camelCase to match TypeScript interface
    const transformedProducts = (data || []).map(product => ({
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
      // Map price fields
      price: product.sale_price || product.regular_price,
      regularPrice: product.regular_price ?? undefined,
      salePrice: product.sale_price ?? undefined,
      // Map category
      category: product.category_id,
      subCategory: product.sub_category_data?.name || null,
      shortDescription: product.short_description,
      options: product.options || [],
      variants: product.variants || [],
      colorOptions: product.color_options || [],
    }));

    return { products: transformedProducts };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [] };
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await getClientWithFallback()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      imageUrl: data.image_url,
      imageAlt: data.image_alt,
      imageHint: data.image_hint,
      galleryImages: data.gallery_images,
      videoUrl: data.video_url,
      imageAttribution: data.image_attribution,
      allowImageUpload: data.allow_image_upload,
      specificDescription: data.specific_description,
      reviewCount: data.review_count,
      price: data.sale_price || data.regular_price,
      regularPrice: data.regular_price ?? undefined,
      salePrice: data.sale_price ?? undefined,
      category: data.category_id,
      subCategory: data.sub_category,
      shortDescription: data.short_description,
      options: data.options || [],
      variants: data.variants || [],
      colorOptions: data.color_options || [],
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProductByName(name: string): Promise<Product | null> {
  try {
    const { data, error } = await getClientWithFallback()
      .from('products')
      .select('*');
    if (error) throw error;

    const product = (data || []).find(p => p.id === name || slugify(p.name) === name || p.id.toLowerCase() === name.toLowerCase());
    if (!product) return null;

    return {
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
      subCategory: product.sub_category,
      shortDescription: product.short_description,
      options: product.options || [],
      variants: product.variants || [],
      colorOptions: product.color_options || [],
    };

  } catch (error) {
    console.error('Error fetching product by name:', error);
    return null;
  }
}


export async function getOrders(): Promise<any[]> {
  try {
    const admin = getClientWithFallback();
    if (!admin) return []; // Admin only
    const { data, error } = await admin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const client = getClientWithFallback();
    const { data, error } = await client
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
        theme_gradient,
        whatsapp_only_checkout_enabled,
        product_id_prefix,
        owner_first_name,
        owner_last_name,
        hero_enabled,
        hero_title,
        hero_subtitle,
        hero_button_text,
        hero_button_link,
        created_at,
        updated_at
      `)
      .maybeSingle();

    if (error) throw error;
    return data || {};
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return {};
  }
}

function extractExcerpt(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 165 ? text.substring(0, 160) + '...' : text;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await getClientWithFallback()
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(post => ({
      slug: post.slug,
      title: post.title,
      date: new Date(post.published_at || post.created_at).toISOString().split('T')[0],
      author: post.author,
      excerpt: post.excerpt || extractExcerpt(post.content),
      imageKey: post.image_key,
      imageUrl: post.image_url,
      imageHint: post.image_hint || post.title,
      content: post.content
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getBlogPostsAdmin(): Promise<BlogPost[]> {
  try {
    const { data, error } = await getClientWithFallback()
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(post => ({
      slug: post.slug,
      title: post.title,
      date: post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : '',
      author: post.author,
      excerpt: post.excerpt || extractExcerpt(post.content),
      imageKey: post.image_key,
      imageUrl: post.image_url,
      imageHint: post.image_hint || post.title,
      content: post.content
    }));
  } catch (error) {
    console.error('Error fetching blog posts (admin):', error);
    return [];
  }
}

export async function getTags(): Promise<string[]> {
  try {
    let client;
    try {
      client = getClientWithFallback();
    } catch (err) {
      return [];
    }

    // Try RPC first (legacy)
    const { data, error } = await client.rpc('get_unique_tags');

    if (error) {
      // Fallback to 'tags' table
      const { data: tagData, error: tagError } = await client.from('tags').select('name');
      if (!tagError && tagData) {
        return tagData.map(t => t.name);
      }
      // If both fail, return empty
      return [];
    }

    // RPC returns an array of objects like [{ tag: 'tag1' }, { tag: 'tag2' }]
    return data?.map((item: any) => item.tag) || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export async function getSiteImages(): Promise<{ placeholderImages: SiteImage[], videos: Video[] }> {
  try {
    // Fetch site images
    const client = getClientWithFallback();
    const { data: imageData, error: imageError } = await client
      .from('site_images')
      .select('*');

    if (imageError) throw imageError;

    const placeholderImages = (imageData || []).map(img => ({
      id: img.id,
      name: img.name,
      description: img.description,
      imageUrl: img.image_url,
      imageHint: img.image_hint,
      buttonText: img.button_text,
      linkUrl: img.link_url,
    }));

    // Fetch videos
    const videos = await getSiteVideos();

    return { placeholderImages, videos };
  } catch (error) {
    console.error('Error fetching site images:', error);
    return { placeholderImages: [], videos: [] };
  }
}

export async function getHeaderLinks(): Promise<any[]> {
  // Returns static links to avoid dependency on navigation_links table which is missing
  return [
    { href: '/collections', label: 'Categories', isMegaMenu: true, special: false },
    { href: '/shop', label: 'Shop', isMegaMenu: false, special: true },
    { href: '/our-story', label: 'Our Story', isMegaMenu: false, special: true },
    { href: '/connect', label: 'Contact Us', isMegaMenu: false, special: false },
  ];
}

export async function getFooterLinkSections(): Promise<any[]> {
  // Return static sections since navigation_links table is deprecated
  return [
    {
      title: 'Shop',
      links: [
        { id: 1, href: '/shop', label: 'All Products' },
        { id: 2, href: '/collections', label: 'Collections' },
        { id: 3, href: '/shop?onSale=true', label: 'Discounts' }
      ]
    },
    {
      title: 'Company',
      links: [
        { id: 4, href: '/our-story', label: 'Our Story' },
        { id: 5, href: '/connect', label: 'Contact' },
        { id: 6, href: '/legal/privacy', label: 'Privacy Policy' }
      ]
    }
  ];
}

export async function getSiteVideos(): Promise<Video[]> {
  try {
    const client = getClientWithFallback();
    const { data, error } = await client
      .from('videos')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return (data || []).map(v => {
      let thumb = v.thumbnail_url || '';
      if (!thumb && v.type === 'youtube') {
        const vid = (() => {
          try {
            const u = new URL(v.url);
            return u.searchParams.get('v') || '';
          } catch {
            return '';
          }
        })();
        if (vid) thumb = `https://img.youtube.com/vi/${vid}/0.jpg`;
      }
      return {
        id: String(v.id),
        type: v.type,
        url: v.url,
        thumbnailUrl: thumb,
      } as Video;
    });
  } catch (error) {
    console.error('Error fetching site videos:', error);
    return [];
  }
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  try {
    const { data, error } = await getClientWithFallback()
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({ ...r, author_name: r.customer_name, is_verified: r.is_approved }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function getRecentReviews(limit = 5): Promise<Review[]> {
  try {
    const { data, error } = await getClientWithFallback()
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent reviews:', error.message || error);
      return [];
    }
    return (data || []).map(r => ({ ...r, author_name: r.customer_name, is_verified: r.is_approved }));
  } catch (error: any) {
    console.error('Error fetching recent reviews:', error?.message || 'Unknown error');
    return [];
  }
}

function sanitizeHtml(text: string): string {
  return text.replace(/<[^>]*>?/gm, '');
}

export async function createReview(reviewData: Omit<Review, 'id' | 'created_at' | 'is_verified'>): Promise<Review | null> {
  try {
    const payload = {
      product_id: reviewData.product_id,
      rating: reviewData.rating,
      comment: sanitizeHtml(reviewData.comment),
      customer_name: sanitizeHtml(reviewData.author_name),
      is_approved: false,
    }
    const { data, error } = await getClientWithFallback()
      .from('reviews')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { ...data, author_name: data.customer_name, is_verified: data.is_approved };
  } catch (error) {
    console.error('Error creating review:', error);
    return null;
  }
}

export async function getHomeBundleServer(): Promise<HomeBundle> {
  try {
    const client = getClientWithFallback();
    const [
      productsRes,
      categoriesRes,
      siteImagesRes,
      slidingCardsRes,
      videosRes,
      testimonialsRes,
    ] = await Promise.all([
      client.from('products').select('*, sub_category_data:categories!products_sub_category_fkey(name)').not('id', 'is', null).order('created_at', { ascending: false }),
      client.from('categories').select('*').order('name'),
      client.from('site_images').select('*').order('id'),
      client.from('sliding_cards').select('*').eq('active', true).order('order_num'),
      client.from('videos').select('*').order('created_at', { ascending: false }),
      client.from('testimonials').select('*').eq('is_visible', true).order('created_at', { ascending: false }),
    ]);

    const categories: Category[] = (categoriesRes.data && categoriesRes.data.length > 0)
      ? categoriesRes.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          imageUrl: cat.image_url || '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
          imageHint: cat.image_hint || '',
          linkUrl: cat.link_url || null,
          is_featured: cat.is_featured ?? true,
          featured_order: cat.featured_order || 0,
          is_trending: cat.is_trending || false,
        }))
      : DUMMY_CATEGORIES;

    const products: Product[] = (productsRes.data && productsRes.data.length > 0)
      ? productsRes.data.map((product: any) => ({
          ...product,
          imageUrl: product.image_url || '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
          imageAlt: product.image_alt || product.name,
          imageHint: product.image_hint || '',
          galleryImages: product.gallery_images || [],
          videoUrl: product.video_url,
          imageAttribution: product.image_attribution,
          allowImageUpload: product.allow_image_upload,
          specificDescription: product.specific_description,
          reviewCount: product.review_count || 0,
          price: product.sale_price || product.regular_price || product.price || 0,
          regularPrice: product.regular_price ?? undefined,
          salePrice: product.sale_price ?? undefined,
          category: product.category_id || product.category || null,
          subCategory: product.sub_category_data?.name || null,
          shortDescription: product.short_description || '',
          colorOptions: product.color_options || [],
        }))
      : DUMMY_PRODUCTS;

    const siteImages: SiteImage[] = (siteImagesRes.data || []).map((img: any) => ({
      id: img.id,
      name: img.name,
      description: img.description || '',
      imageUrl: img.image_url || '',
      imageHint: img.image_hint || '',
      linkUrl: img.link_url || null,
      buttonText: img.button_text,
      isVisible: img.is_visible ?? true,
    }));

    const slidingCards: SlidingCard[] = slidingCardsRes.data || [];
    const videos = videosRes.data || [];
    const testimonials: Testimonial[] = testimonialsRes.data || [];
    const featuredCategories = categories.filter((c: any) => c.is_featured);

    return {
      products,
      categories,
      siteImages,
      slidingCards,
      featuredCategories,
      videos,
      testimonials,
    };
  } catch (error) {
    console.error('getHomeBundleServer error, falling back to dummy:', error);
    return {
      products: DUMMY_PRODUCTS,
      categories: DUMMY_CATEGORIES,
      siteImages: [],
      slidingCards: [],
      featuredCategories: DUMMY_CATEGORIES.filter((c: any) => c.is_featured),
      videos: [],
      testimonials: [],
    };
  }
}

