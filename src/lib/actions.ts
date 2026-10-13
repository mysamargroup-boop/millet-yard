

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Product, BlogPost, Category, SiteImageData, SiteImage, Coupon, Subscription, SiteSettings, Review, ProductQuestion } from "./types";
import { supabaseAdmin } from "./supabase";
import { getTags as getTagsFromSupabase } from './data-supabase';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "./whatsapp-cloud";
import { slugify } from "./utils";
import { API } from "@/config/api";
import { getAdminCategories } from "./data-supabase";

export async function getAdminCategoriesAction(): Promise<Category[]> {
  try {
    const categories = await getAdminCategories();
    // If empty, it means admin client failed or no data.
    // Try one more time with explicit admin client init inside this scope to be sure.
    if (!categories || categories.length === 0) {
      const supabase = supabaseAdmin();
      if (!supabase) {
        console.error('[ServerAction] getAdminCategoriesAction: fallback admin client failed');
        return [];
      }
      const { data, error } = await supabase.from('categories').select('*').order('name');

      if (error) {
        console.error('[ServerAction] getAdminCategoriesAction: fallback query error:', error);
        return [];
      }

      const result = (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.image_url || 'https://placehold.co/96x96?text=Category',
        imageHint: cat.image_hint || '',
        linkUrl: cat.link_url || null,
        is_featured: cat.is_featured || false,
        featured_order: cat.featured_order || 0,
        size_guide_image_url: cat.size_guide_image_url || null,
      }));
      return result;
    }
    return categories;
  } catch (error: any) {
    console.error("[ServerAction] Error in getAdminCategoriesAction:", error);
    return [];
  }
}

async function createNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', link?: string) {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) return;

    await supabase.from('notifications').insert({
      title,
      message,
      type,
      link,
      is_read: false
    });
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
  }
}

export async function getNotifications() {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Notification] Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Notification] Error in getNotifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) return { success: false };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('[Notification] Error marking notification as read:', error);
      return { success: false };
    }

    revalidatePath('/sr-admin');
    return { success: true };
  } catch (error) {
    console.error('[Notification] Error in markNotificationAsRead:', error);
    return { success: false };
  }
}

// Note: Site settings now stored in database, no JSON files used

const siteSettingsSchema = z.object({
  id: z.string().optional(),
  owner_first_name: z.string().optional(),
  owner_last_name: z.string().optional(),
  logo_url: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  contact_hours: z.string().optional(),
  maintenance_mode_enabled: z.coerce.boolean().optional(),
  maintenance_mode_message: z.string().optional(),
  social_facebook: z.string().url().optional().or(z.literal('')),
  social_instagram: z.string().url().optional().or(z.literal('')),
  social_youtube: z.string().url().optional().or(z.literal('')),
  social_linkedin: z.string().url().optional().or(z.literal('')),
  social_twitter: z.string().url().optional().or(z.literal('')),
  home_meta_title: z.string().optional(),
  home_meta_description: z.string().optional(),
  google_verification_code: z.string().optional(),
  google_tag_manager_id: z.string().optional(),
  invoice_business_name: z.string().optional(),
  invoice_business_address: z.string().optional(),
  invoice_logo_url: z.string().optional(),
  invoice_tax_percent: z.coerce.number().optional(),
  invoice_currency_symbol: z.string().optional(),
  invoice_gst_number: z.string().optional(),
  invoice_phone: z.string().optional(),
  invoice_email: z.string().email().optional().or(z.literal('')),
  invoice_terms: z.string().optional(),
  expected_delivery_min_days: z.coerce.number().optional(),
  expected_delivery_max_days: z.coerce.number().optional(),
  free_shipping_threshold: z.coerce.number().optional(),
  promo_banner_enabled: z.coerce.boolean().optional(),
  promo_banner_title: z.string().optional(),
  promo_banner_subtitle: z.string().optional(),
  timer_banner_enabled: z.coerce.boolean().optional(),
  timer_banner_title: z.string().optional(),
  timer_banner_image_url: z.string().optional(),
  timer_banner_end_date: z.string().optional(),
  theme_background: z.string().optional(),
  theme_gradient: z.string().optional(),
  theme_muted: z.string().optional(),
  redirects: z.string().optional(),
  whatsapp_only_checkout_enabled: z.coerce.boolean().optional(),
  product_id_prefix: z.string().regex(/^[A-Z]{2}$/, "Must be exactly 2 capital letters").optional(),
  whatsapp_otp_template: z.string().optional(),
  payment_gateway: z.string().optional(),
  banner_effect: z.string().optional(),
  hero_enabled: z.coerce.boolean().optional(),
  hero_title: z.string().optional(),
  hero_subtitle: z.string().optional(),
  hero_button_text: z.string().optional(),
  hero_button_link: z.string().optional(),
  hero_desktop_image_id: z.string().optional(),
  hero_mobile_image_id: z.string().optional(),
});

const productSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional().or(z.literal('')),
  regularPrice: z.coerce.number().min(0, "Regular price cannot be negative"), // Changed from 0.01 to 0 to be safer
  salePrice: z.coerce.number().optional().or(z.literal(0)).transform(v => v === 0 ? undefined : v),
  costPrice: z.coerce.number().optional().or(z.literal(0)).transform(v => v === 0 ? undefined : v),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal('')), // Allow empty temporarily or handle via validation
  imageAlt: z.string().optional().or(z.literal('')),
  imageHint: z.string().optional().or(z.literal('')),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  imageAttribution: z.string().optional().or(z.literal('')),
  license: z.string().optional().or(z.literal('')),
  inventory: z.coerce.number().min(0, "Inventory can't be negative").default(0),
  features: z.string().optional().or(z.literal('')),
  galleryImages: z.string().optional().or(z.literal('')),
  specificDescription: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  material: z.string().optional().or(z.literal('')),
  colorOptions: z.string().optional().or(z.literal('')),
  badge: z.string().optional().or(z.literal('')),
  allowImageUpload: z.enum(['on', 'off']).optional(),
  options: z.string().optional().or(z.literal('')), // JSON string
  variants: z.string().optional().or(z.literal('')), // JSON string
  weight: z.coerce.number().optional().or(z.literal(0)),
  weightUnit: z.string().optional().or(z.literal('')),
  length: z.coerce.number().optional().or(z.literal(0)),
  width: z.coerce.number().optional().or(z.literal(0)),
  height: z.coerce.number().optional().or(z.literal(0)),
  dimensionUnit: z.string().optional().or(z.literal('')),
});


const blogPostSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  author: z.string().min(1, "Author is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  imageKey: z.string().min(1, "Image Key is required"),
  content: z.string().min(1, "Content is required"),
  /** Optional override to bypass placeholder image mapping */
  imageUrl: z.string().url("Must be a valid URL").optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url("Must be a valid URL").optional(),
  imageHint: z.string().optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  is_trending: z.coerce.boolean().optional(),
  sizeGuideImageUrl: z.string().url().optional().or(z.literal('')),
});

const siteImageSchema = z.object({
  id: z.string().min(1, "ID is required"),
  newId: z.string().optional(),
  name: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL"),
  imageHint: z.string().optional(),
  buttonText: z.string().optional(),
  linkUrl: z.string().optional(),
});


const toArray = (value?: string) => value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabaseAdmin()
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
  return data || [];
}

const subscriptionSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10).max(15).regex(/^\d+$/),
  source: z.string().optional(),
});

export async function createSubscription(input: { name: string; phone: string; source?: string }): Promise<{ success: boolean }> {
  const validated = subscriptionSchema.safeParse({
    name: input.name,
    phone: input.phone.replace(/\D/g, '').slice(-10) ? `91${'\'\'\''}${input.phone.replace(/\D/g, '').slice(-10)}` : input.phone,
    source: input.source,
  });
  if (!validated.success) {
    return { success: false };
  }

  const { error } = await supabaseAdmin()
    .from('subscriptions')
    .insert({
      name: validated.data.name,
      phone: validated.data.phone,
      source: validated.data.source,
    });

  if (error) {
    console.error('Error creating subscription:', error);
    return { success: false };
  }

  revalidatePath('/sr-admin/marketing');
  return { success: true };
}


export async function createProduct(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  console.log('DEBUG: createProduct received data:', data);
  const validatedFields = productSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error('DEBUG: createProduct validation FAILED:', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { features, galleryImages, tags, allowImageUpload, options, variants, ...rest } = validatedFields.data;

  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      console.error('Supabase Admin client not initialized');
      return { errors: { _form: ["System Configuration Error: Admin keys missing. Check environment variables."] } };
    }

    // Map weight to weight_grams
    let weightGrams = 0;
    if (rest.weight && rest.weightUnit) {
      if (rest.weightUnit === 'kg') weightGrams = Math.round(rest.weight * 1000);
      else if (rest.weightUnit === 'g') weightGrams = Math.round(rest.weight);
      else if (rest.weightUnit === 'lb') weightGrams = Math.round(rest.weight * 453.592);
      else if (rest.weightUnit === 'oz') weightGrams = Math.round(rest.weight * 28.3495);
    }

    const { error } = await supabase
      .from('products')
      .insert({
        id: rest.id,
        name: rest.name,
        short_description: rest.shortDescription || null,
        description: rest.description,
        regular_price: rest.regularPrice,
        sale_price: rest.salePrice || null,
        cost_price: rest.costPrice || null,
        specific_description: rest.specificDescription || null,
        category_id: rest.category,
        sub_category: (rest.subCategory === 'none' ? null : rest.subCategory) || null,
        image_url: rest.imageUrl,
        image_alt: rest.imageAlt || null,
        image_hint: rest.imageHint || null,
        inventory: rest.inventory,
        tags: toArray(tags),
        gallery_images: toArray(galleryImages),
        allow_image_upload: allowImageUpload === 'on',
        video_url: rest.videoUrl || null,
        image_attribution: rest.imageAttribution || null,
        license: rest.license || null,
        material: rest.material || null,
        color: rest.colorOptions || null,
        badge: rest.badge || null,
        features: toArray(features),
        options: options ? (() => { try { return JSON.parse(options); } catch { return []; } })() : [],
        variants: variants ? (() => { try { return JSON.parse(variants); } catch { return []; } })() : [],
        color_options: rest.colorOptions ? (() => { try { return JSON.parse(rest.colorOptions); } catch { return []; } })() : [],
        weight_grams: weightGrams || null,
        dimensions_length: rest.length || null,
        dimensions_width: rest.width || null,
        dimensions_height: rest.height || null,
      });

    if (error) {
      console.error('Supabase Create Product Error:', error);
      return { errors: { _form: [error.message] } };
    }

    // Low stock notification
    if (rest.inventory < 5) {
      await createNotification(
        'Low Stock Alert',
        `Product "${rest.name}" has low inventory (${rest.inventory} left).`,
        'warning',
        `/sr-admin/products/${rest.id}/edit`
      );
    }

    revalidatePath("/sr-admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error('Create product action error:', error);
    return { errors: { _form: [`System Error: ${error.message || "Unknown error"}`] } };
  }
}

export async function updateProduct(productId: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = productSchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { features, galleryImages, tags, allowImageUpload, options, variants, colorOptions, ...rest } = validatedFields.data;
  const payload: any = {};

  if (allowImageUpload !== undefined) payload.allow_image_upload = allowImageUpload === 'on';

  // Map weight to weight_grams
  if (rest.weight !== undefined && rest.weightUnit !== undefined) {
    let weightGrams = 0;
    if (rest.weightUnit === 'kg') weightGrams = Math.round(rest.weight * 1000);
    else if (rest.weightUnit === 'g') weightGrams = Math.round(rest.weight);
    else if (rest.weightUnit === 'lb') weightGrams = Math.round(rest.weight * 453.592);
    else if (rest.weightUnit === 'oz') weightGrams = Math.round(rest.weight * 28.3495);
    payload.weight_grams = weightGrams || null;
  }

  if (rest.length !== undefined) payload.dimensions_length = rest.length || null;
  if (rest.width !== undefined) payload.dimensions_width = rest.width || null;
  if (rest.height !== undefined) payload.dimensions_height = rest.height || null;
  if (rest.videoUrl !== undefined) payload.video_url = rest.videoUrl || null;
  if (rest.imageAttribution !== undefined) payload.image_attribution = rest.imageAttribution || null;
  if (rest.license !== undefined) payload.license = rest.license || null;
  if (rest.material !== undefined) payload.material = rest.material;
  if (colorOptions !== undefined) payload.color = colorOptions || null;
  if (colorOptions !== undefined) {
    try { payload.color_options = colorOptions ? JSON.parse(colorOptions) : []; } catch { payload.color_options = []; }
  }
  if (rest.badge !== undefined) payload.badge = rest.badge || null;
  if (rest.specificDescription !== undefined) payload.specific_description = rest.specificDescription || null;
  if (features !== undefined) payload.features = toArray(features);
  if (options !== undefined) payload.options = options ? JSON.parse(options) : [];
  if (variants !== undefined) payload.variants = variants ? JSON.parse(variants) : [];

  if (rest.weight !== undefined) payload.weight = rest.weight || null;
  if (rest.weightUnit !== undefined) payload.weight_unit = rest.weightUnit || null;
  if (rest.length !== undefined || rest.width !== undefined || rest.height !== undefined) {
    payload.dimensions = {
      length: rest.length || 0,
      width: rest.width || 0,
      height: rest.height || 0,
      unit: rest.dimensionUnit || 'cm'
    };
  }
  if (rest.dimensionUnit !== undefined) payload.dimension_unit = rest.dimensionUnit || null;
  if (rest.costPrice !== undefined) payload.cost_price = rest.costPrice || null;

  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      console.error('Supabase Admin client not initialized');
      return { errors: { _form: ["System Configuration Error: Admin access not configured."] } };
    }

    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId);

    if (error) {
      console.error('Supabase Update Product Error:', error);
      return { errors: { _form: [error.message] } };
    }

    // Check for low stock notification
    if (payload.inventory !== undefined && payload.inventory < 5) {
      await createNotification(
        'Low Stock Alert',
        `Product "${payload.name || productId}" inventory is now ${payload.inventory}.`,
        'warning',
        `/sr-admin/products/${productId}/edit`
      );
    }

    revalidatePath(`/sr-admin/products`);
    revalidatePath(`/sr-admin/products/${productId}/edit`);
    revalidatePath(`/collections`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error('Update product error:', error);
    return { errors: { _form: [`System Error: ${error.message || "Unknown error"}`] } };
  }
}


export async function deleteProductAction(formData: FormData) {
  const productId = formData.get('id') as string;
  if (!productId) return;

  const supabase = supabaseAdmin();
  if (!supabase) {
    console.error("Delete action failed: No admin client");
    return;
  }
  await supabase.from('products').delete().eq('id', productId);

  revalidatePath("/sr-admin/products");
  revalidatePath(`/collections`);
  revalidatePath("/");
}


export async function createBlogPost(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = blogPostSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { imageKey, imageUrl, date, ...rest } = validatedFields.data;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', rest.slug)
    .single();

  if (existing) {
    return { errors: { slug: ["A blog post with this slug already exists."] } };
  }

  const { error } = await supabase.from('blog_posts').insert({
    slug: rest.slug,
    title: rest.title,
    published_at: date ? new Date(date).toISOString() : null,
    author: rest.author,
    excerpt: rest.excerpt,
    image_key: imageKey,
    image_url: imageUrl,
    content: rest.content
  });

  if (error) {
    return { errors: { _form: ["Database Error: Failed to create blog post."] } };
  }

  revalidatePath("/sr-admin/blogs");
  revalidatePath("/blog");
  return { success: true };
}

export async function updateBlogPost(slug: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = blogPostSchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { imageKey, imageUrl, date, ...rest } = validatedFields.data;
  const supabase = supabaseAdmin();

  const updatePayload: any = {};
  if (rest.title !== undefined) updatePayload.title = rest.title;
  if (rest.author !== undefined) updatePayload.author = rest.author;
  if (rest.excerpt !== undefined) updatePayload.excerpt = rest.excerpt;
  if (rest.content !== undefined) updatePayload.content = rest.content;
  if (date !== undefined) updatePayload.published_at = date ? new Date(date).toISOString() : null;
  if (imageKey !== undefined) updatePayload.image_key = imageKey;
  if (imageUrl !== undefined) updatePayload.image_url = imageUrl;

  const { error } = await supabase
    .from('blog_posts')
    .update(updatePayload)
    .eq('slug', slug);

  if (error) {
    return { errors: { _form: ["Database Error: Failed to update blog post."] } };
  }

  revalidatePath(`/sr-admin/blogs`);
  revalidatePath(`/blog`);
  revalidatePath(`/blog/${slug}`);
  return { success: true };
}

export async function deleteBlogPostAction(slug: string) {
  const supabase = supabaseAdmin();
  await supabase.from('blog_posts').delete().eq('slug', slug);

  revalidatePath("/sr-admin/blogs");
  revalidatePath("/blog");
}

export async function updateSiteImage(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = siteImageSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
    return;
  }

  const { id, newId, imageUrl, imageHint, name, buttonText, linkUrl } = validatedFields.data;

  try {
    // If newId is provided, we need to update the ID
    if (newId && newId !== id) {
      // First get the current record
      const { data: currentRecord, error: fetchError } = await supabaseAdmin()
        .from('site_images')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete old record
      const { error: deleteError } = await supabaseAdmin()
        .from('site_images')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Insert new record with new ID
      const { error: insertError } = await supabaseAdmin()
        .from('site_images')
        .insert({
          id: newId,
          name: name || currentRecord.name,
          description: currentRecord.description,
          image_url: imageUrl || currentRecord.image_url,
          image_hint: imageHint || currentRecord.image_hint,
          button_text: buttonText || currentRecord.button_text,
          link_url: linkUrl || currentRecord.link_url,
        });

      if (insertError) throw insertError;
    } else {
      // Regular update without ID change
      const { error } = await supabaseAdmin()
        .from('site_images')
        .update({
          image_url: imageUrl,
          image_hint: imageHint,
          name: name,
          button_text: buttonText,
          link_url: linkUrl,
        })
        .eq('id', id);

      if (error) throw error;
    }

    revalidatePath(`/`, 'layout');
    revalidatePath('/sr-admin/site-images');
  } catch (error: any) {
    console.error("Error updating site image:", error);
  }
}


export async function createCategory(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = categorySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, imageUrl, imageHint, linkUrl, sizeGuideImageUrl } = validatedFields.data;
  const id = slugify(name);

  try {
    const client = supabaseAdmin();
    if (!client) throw new Error("Supabase admin client not initialized");

    const { error } = await client
      .from('categories')
      .insert({
        id,
        name,
        image_url: imageUrl,
        image_hint: imageHint,
        link_url: linkUrl,
        is_trending: validatedFields.data.is_trending || false,
        size_guide_image_url: sizeGuideImageUrl || null,
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { errors: { name: ["A category with this name already exists."] } };
      }
      throw error;
    }

    revalidatePath("/sr-admin/categories");
    revalidatePath("/collections");
    revalidatePath("/", "layout");
    return { success: true, categoryId: id };
  } catch (error: any) {
    console.error('Create category error:', error);
    return { errors: { _form: ["Failed to create category directly."] } };
  }
}


export async function quickCreateCategory(name: string) {
  if (!name) return { error: "Name is required" };
  const id = slugify(name);

  try {
    const client = supabaseAdmin();
    if (!client) throw new Error("Supabase admin client not initialized");

    const { error } = await client
      .from('categories')
      .insert({
        id,
        name,
        image_url: 'https://placehold.co/400x400?text=' + encodeURIComponent(name),
        image_hint: name,
        is_trending: false,
      });

    if (error) {
      if (error.code === '23505') return { error: "Category already exists" };
      throw error;
    }

    revalidatePath("/sr-admin/categories");
    revalidatePath("/", "layout");
    return { success: true, categoryId: id, name };
  } catch (error: any) {
    console.error('Quick create category error:', error);
    return { error: "Failed to create category" };
  }
}


export async function updateCategory(categoryId: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = categorySchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, imageUrl, imageHint, linkUrl, is_trending, sizeGuideImageUrl } = validatedFields.data;

  const updatePayload: any = {};
  if (name !== undefined) updatePayload.name = name;
  if (imageUrl !== undefined) updatePayload.image_url = imageUrl;
  if (imageHint !== undefined) updatePayload.image_hint = imageHint;
  if (linkUrl !== undefined) updatePayload.link_url = linkUrl;
  if (is_trending !== undefined) updatePayload.is_trending = is_trending;
  if (sizeGuideImageUrl !== undefined) updatePayload.size_guide_image_url = sizeGuideImageUrl || null;

  try {
    // Call Cloudflare Workers API
    const response = await fetch(`${API.CATEGORIES}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        categoryId,
        data: updatePayload
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { errors: { _form: [errorData.error || "Failed to update category."] } };
    }

    revalidatePath(`/sr-admin/categories`);
    revalidatePath(`/collections`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error('Update category error:', error);
    return { errors: { _form: ["Network error: Failed to update category."] } };
  }
}

export async function deleteCategoryAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;

  const supabase = supabaseAdmin();
  await supabase.from('categories').delete().eq('id', id);

  revalidatePath("/sr-admin/categories");
  revalidatePath("/collections");
  revalidatePath("/", "layout");
}

export async function getAdminSiteSettings(): Promise<SiteSettings> {
  // 1. Try Redis Cache first
  try {
    const { getCachedData } = await import('./redis');
    const cached = await getCachedData('site-settings-admin');
    if (cached) {
      return cached;
    }
  } catch { }

  // 2. Fallback to Supabase
  try {
    const { data, error } = await supabaseAdmin()
      .from('site_settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    // Cache for 10 minutes
    if (data) {
      try {
        const { setCachedData } = await import('./redis');
        await setCachedData('site-settings-admin', data, 600);
      } catch { }
    }

    return data || {};
  } catch (error: any) {
    console.error('Error fetching admin site settings:', error);
    return {};
  }
}

export async function getSiteSettings(): Promise<Partial<SiteSettings>> {
  // 1. Try Redis Cache first
  try {
    const { getCachedData } = await import('./redis');
    const cached = await getCachedData('site-settings-public');
    if (cached) {
      return cached;
    }
  } catch { }

  // 2. Fallback to Supabase
  try {
    const { data, error } = await supabaseAdmin()
      .from('site_settings')
      .select(`
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
        owner_first_name,
        owner_last_name,
        hero_enabled,
        hero_title,
        hero_subtitle,
        hero_button_text,
        hero_button_link,
        updated_at
      `)
      .maybeSingle();

    if (error) throw error;

    // Cache for 10 minutes
    if (data) {
      try {
        const { setCachedData } = await import('./redis');
        await setCachedData('site-settings-public', data, 600);
      } catch { }
    }

    return data || {};
  } catch (error: any) {
    console.error('Error fetching public site settings:', error);
    return {};
  }
}

import { cookies } from "next/headers";

export async function updateSiteSettings(previousState: any, formData: FormData) {
  // basic security check
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token');

  if (!adminToken) {
    return { message: 'Unauthorized: Please login first' };
  }

  const mode = formData.get('_mode');
  const data: any = Object.fromEntries(formData.entries());

  // Explicitly handle boolean fields (check boxes/switches) which are missing when unchecked
  if (mode === 'invoiceOnly' || mode === 'all') {
    data.customer_login_enabled = formData.get('customer_login_enabled') === 'on';
  }
  if (mode === 'bannersOnly' || mode === 'all') {
    data.timer_banner_enabled = formData.get('timer_banner_enabled') === 'on';
    data.hero_enabled = formData.get('hero_enabled') === 'on';
  }
  if (mode === 'generalOnly' || mode === 'all') {
    data.promo_banner_enabled = formData.get('promo_banner_enabled') === 'on';
    data.maintenance_mode_enabled = formData.get('maintenance_mode_enabled') === 'on';
  }

  const validatedFields = siteSettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('site_settings')
      .upsert(validatedFields.data, { onConflict: 'id' });

    if (error) throw error;

    // Invalidate Redis cache
    try {
      const { deleteCachedData } = await import('./redis');
      await deleteCachedData('site-settings');
      console.log('[Cache] Site settings cache invalidated');
    } catch { }

    revalidatePath('/', 'layout');
    return { success: true, message: 'Settings updated successfully' };
  } catch (error: any) {
    console.error("Error writing settings to Supabase:", error);
    return { message: 'Database Error: Failed to update settings.' };
  }
}




const couponSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  type: z.enum(['percent', 'flat']),
  value: z.coerce.number().min(0, "Value must be positive"),
  show_on_offers_page: z.coerce.boolean().optional(),
});

const updateCouponSchema = couponSchema.extend({
  originalCode: z.string().min(1)
});

export async function getCoupons() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('coupons')
      .select('*')
      .eq('active', true)
      .order('value', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        code: c.code,
        type: c.type,
        value: c.value,
        active: c.active,
        description: c.description,
        min_cart_value: c.min_cart_value,
        show_on_offers_page: true,
      })) as Coupon[];
    }
  } catch (err) {
    console.warn('Error fetching coupons from Supabase:', err);
  }

  try {
    const response = await fetch(API.COUPONS_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'list' }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((c: any) => ({
      ...c,
      show_on_offers_page: c.show_on_offers_page ?? true,
    })) as Coupon[];
  } catch (error: any) {
    return [];
  }
}

export async function createCoupon(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = couponSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const response = await fetch(API.COUPONS_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        data: {
          code: validatedFields.data.code,
          type: validatedFields.data.type,
          value: validatedFields.data.value,
          show_on_offers_page: validatedFields.data.show_on_offers_page,
        },
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || (result && result.error)) {
      return {
        message:
          result?.error ||
          'Database Error: Failed to create coupon.',
        success: false,
      };
    }

    revalidatePath('/sr-admin/coupons');
    revalidatePath('/offers');
    return { success: true, message: 'Coupon created successfully' };
  } catch (error: any) {
    return { message: 'Database Error: Failed to create coupon.', success: false };
  }
}

export async function updateCoupon(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = updateCouponSchema.safeParse(data);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors, success: false };
  }

  const { originalCode, ...couponData } = validatedFields.data;

  try {
    const response = await fetch(API.COUPONS_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        data: {
          originalCode,
          code: couponData.code,
          type: couponData.type,
          value: couponData.value,
          show_on_offers_page: couponData.show_on_offers_page,
        },
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || (result && result.error)) {
      return {
        message:
          result?.error ||
          'Database Error: Failed to update coupon.',
        success: false,
      };
    }

    revalidatePath('/sr-admin/coupons');
    revalidatePath('/offers');
    return { success: true, message: 'Coupon updated successfully.' };
  } catch (error: any) {
    return { message: 'Database Error: Failed to update coupon.', success: false };
  }
}


export async function deleteCoupon(code: string) {
  try {
    const response = await fetch(API.COUPONS_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        code,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || (result && result.error)) {
      return { message: 'Database Error: Failed to delete coupon.' };
    }
    revalidatePath('/sr-admin/coupons');
    revalidatePath('/offers');
    return { success: true, message: 'Coupon deleted successfully' };
  } catch (error: any) {
    return { message: 'Database Error: Failed to delete coupon.' };
  }
}

export async function toggleCouponStatus(code: string) {
  try {
    const response = await fetch(API.COUPONS_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'toggle-status',
        code,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || (result && result.error)) {
      return {
        message:
          result?.error ||
          'Database Error: Failed to update coupon.',
      };
    }

    revalidatePath('/sr-admin/coupons');
    revalidatePath('/offers');
    return { success: true, message: 'Coupon status updated' };
  } catch (error: any) {
    return { message: 'Database Error: Failed to update coupon.' };
  }
}

export async function toggleCouponVisibility(code: string) {
  try {
    const response = await fetch(API.COUPONS_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'toggle-visibility',
        code,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || (result && result.error)) {
      return {
        message:
          result?.error ||
          'Database Error: Failed to update coupon visibility.',
      };
    }

    revalidatePath('/sr-admin/coupons');
    revalidatePath('/offers');
    return { success: true, message: 'Coupon visibility updated' };
  } catch (error: any) {
    return { message: 'Database Error: Failed to update coupon visibility.' };
  }
}


const navigationLinkSchema = z.object({
  id: z.coerce.number().optional(),
  area: z.enum(['header', 'footer']),
  section: z.string().optional(),
  href: z.string().min(1),
  label: z.string().min(1),
  sort_order: z.coerce.number().optional(),
  is_mega_menu: z.coerce.boolean().optional(),
  special: z.coerce.boolean().optional(),
});

export async function createNavigationLink(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = navigationLinkSchema.safeParse(data);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const payload: any = {
    area: validated.data.area,
    href: validated.data.href,
    label: validated.data.label,
    sort_order: validated.data.sort_order ?? 0,
    is_mega_menu: validated.data.is_mega_menu ?? false,
    special: validated.data.special ?? false,
  };
  if (validated.data.area === 'footer') {
    payload.section = validated.data.section || 'Links';
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('navigation_links').insert(payload);
  if (error) {
    return { message: 'Database Error: Failed to create navigation link.' };
  }
  revalidatePath('/sr-admin/navigation');
  revalidatePath('/');
  return { success: true };
}

export async function updateNavigationLink(linkId: number, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = navigationLinkSchema.partial().safeParse(data);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const payload: any = {};
  const fields = ['area', 'section', 'href', 'label', 'sort_order', 'is_mega_menu', 'special'] as const;
  for (const f of fields) {
    if ((validated.data as any)[f] !== undefined) payload[f] = (validated.data as any)[f];
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('navigation_links').update(payload).eq('id', linkId);
  if (error) {
    return { message: 'Database Error: Failed to update navigation link.' };
  }
  revalidatePath('/sr-admin/navigation');
  revalidatePath('/');
  return { success: true };
}

export async function deleteNavigationLink(formData: FormData) {
  const idRaw = formData.get('id');
  const id = idRaw ? Number(idRaw) : NaN;
  if (!id || Number.isNaN(id)) {
    return { message: 'Invalid link id' };
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('navigation_links').delete().eq('id', id);
  if (error) {
    return { message: 'Database Error: Failed to delete navigation link.' };
  }
  revalidatePath('/sr-admin/navigation');
  revalidatePath('/');
  return { success: true };
}


export async function bulkUpdateProductPrices(previousState: any, formData: FormData) {
  const idsRaw = String(formData.get('ids') || '').trim();
  const percent = Number(formData.get('percent') || 0);
  const mode = String(formData.get('mode') || '').toLowerCase();
  if (!idsRaw) {
    return { success: false, message: 'No products selected' };
  }
  if (!percent || percent <= 0) {
    return { success: false, message: 'Enter a valid percentage' };
  }
  if (mode !== 'increase' && mode !== 'decrease') {
    return { success: false, message: 'Invalid mode' };
  }
  const ids: string[] = idsRaw.includes(',') ? idsRaw.split(',').map(s => s.trim()).filter(Boolean) : JSON.parse(idsRaw);
  const factor = percent / 100;
  const supabase = supabaseAdmin();
  let updatedCount = 0;
  const { data: products, error } = await supabase
    .from('products')
    .select('id, regular_price, sale_price')
    .in('id', ids);
  if (error) {
    return { success: false, message: 'Failed to fetch selected products' };
  }
  for (const p of (products || [])) {
    const base = typeof p.sale_price === 'number' ? Number(p.sale_price) : (typeof p.regular_price === 'number' ? Number(p.regular_price) : 0);
    const change = base * factor;
    const newPrice = mode === 'increase' ? base + change : base - change;
    const nextRegular = Math.max(0.01, Number(newPrice.toFixed(2)));
    const { error: upErr } = await supabase
      .from('products')
      .update({ regular_price: nextRegular })
      .eq('id', p.id);
    if (!upErr) updatedCount++;
  }
  revalidatePath('/sr-admin/products');
  revalidatePath('/collections');
  revalidatePath('/');
  return { success: true, updatedCount };
}


const bulkWhatsappSchema = z.object({
  phoneNumbers: z.array(z.string()),
  templateName: z.string(),
  variables: z.array(z.string()),
});

export async function sendBulkWhatsappMessages(data: {
  phoneNumbers: string[],
  templateName: string,
  variables: string[]
}) {
  const validatedFields = bulkWhatsappSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error("Invalid data provided to sendBulkWhatsappMessages.");
  }

  const { phoneNumbers, templateName, variables } = validatedFields.data;

  const results = [];

  for (const number of phoneNumbers) {
    try {
      // Use Cloudflare Workers API instead of direct WhatsApp
      const response = await fetch(`${API.WHATSAPP_SEND_TEMPLATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `91${number}`,
          templateName: templateName,
          languageCode: 'en',
          bodyParameters: variables,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send WhatsApp message');
      }

      const result = await response.json();
      results.push({ number, success: true, result });
    } catch (error: any) {
      console.error(`Failed to send WhatsApp to ${number}:`, error);
      results.push({ number, success: false, error: error.message });
    }
  }

  return results;
}

const bulkSimpleWhatsappSchema = z.object({
  phoneNumbers: z.array(z.string()),
  message: z.string().min(1),
});

export async function sendBulkSimpleWhatsappMessages(data: {
  phoneNumbers: string[];
  message: string;
}) {
  const validatedFields = bulkSimpleWhatsappSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error("Invalid data provided to sendBulkSimpleWhatsappMessages.");
  }

  const { phoneNumbers, message } = validatedFields.data;
  const results = [];

  for (const number of phoneNumbers) {
    try {
      // Use Cloudflare Workers API instead of direct WhatsApp
      const response = await fetch(`${API.SEND_WHATSAPP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `91${number}`,
          body: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send WhatsApp message');
      }

      const result = await response.json();
      results.push({ number, success: true, result });
    } catch (error: any) {
      console.error(`Failed to send message to ${number}:`, error);
      results.push({ number, success: false, error: error.message });
    }
  }

  return results;
}


export async function getTagsList(): Promise<string[]> {
  return getTagsFromSupabase();
}

export async function bulkAddTagToProducts(previousState: any, formData: FormData) {
  const idsRaw = String(formData.get('ids') || '').trim();
  const tag = String(formData.get('tag') || '').trim();

  if (!idsRaw) return { success: false, message: 'No products selected' };
  if (!tag) return { success: false, message: 'Select a tag' };

  const ids: string[] = idsRaw.includes(',') ? idsRaw.split(',').map(s => s.trim()).filter(Boolean) : JSON.parse(idsRaw);
  const supabase = supabaseAdmin();

  // 1. Fetch products to get current tags
  const { data: products, error } = await supabase
    .from('products')
    .select('id, tags')
    .in('id', ids);

  if (error || !products) {
    return { success: false, message: 'Failed to fetch products' };
  }

  let updatedCount = 0;

  // 2. Update each product if needed
  for (const p of products) {
    const currentTags = Array.isArray(p.tags) ? p.tags : [];
    // Check case-insensitive existence
    if (!currentTags.some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
      const newTags = [...currentTags, tag];

      const { error: updateError } = await supabase
        .from('products')
        .update({ tags: newTags })
        .eq('id', p.id);

      if (!updateError) {
        updatedCount++;
      }
    }
  }

  revalidatePath('/sr-admin/products');
  revalidatePath('/collections');
  revalidatePath('/');
  return { success: true, updatedCount };
}

export async function getReviewsAdmin(): Promise<Review[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({ ...r, author_name: r.customer_name, is_verified: r.is_approved }));
  } catch (error: any) {
    console.error('Error fetching reviews for admin:', error);
    return [];
  }
}

export async function updateReviewStatus(reviewId: string, isVerified: boolean) {
  try {
    const { error } = await supabaseAdmin()
      .from('reviews')
      .update({ is_approved: isVerified, updated_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (error) throw error;
    revalidatePath('/sr-admin/reviews');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: 'Failed to update review status.' };
  }
}


export async function deleteReview(reviewId: string) {
  try {
    const { error } = await supabaseAdmin()
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw error;
    revalidatePath('/sr-admin/reviews');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: 'Failed to delete review.' };
  }
}

// Sliding Cards Actions
export async function createSlidingCard(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  const slidingCardSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    image_url: z.string().url("Must be a valid URL"),
    image_hint: z.string().optional(),
    link_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    order_num: z.coerce.number().min(0, "Order must be non-negative"),
    active: z.coerce.boolean().default(true),
  });

  const validatedFields = slidingCardSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { error } = await supabaseAdmin()
      .from('sliding_cards')
      .insert(validatedFields.data);

    if (error) {
      return { errors: { _form: ["Database Error: Failed to create sliding card."] } };
    }

    revalidatePath("/sr-admin/sliding-cards");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { errors: { _form: ["Network error: Failed to create sliding card."] } };
  }
}

export async function updateSlidingCard(cardId: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  const slidingCardSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    image_url: z.string().url("Must be a valid URL").optional(),
    image_hint: z.string().optional(),
    link_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    order_num: z.coerce.number().min(0, "Order must be non-negative").optional(),
    active: z.coerce.boolean().optional(),
  });

  const validatedFields = slidingCardSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const updatePayload: any = {};
  Object.keys(validatedFields.data).forEach(key => {
    if (validatedFields.data[key as keyof typeof validatedFields.data] !== undefined) {
      updatePayload[key] = validatedFields.data[key as keyof typeof validatedFields.data];
    }
  });

  try {
    const { error } = await supabaseAdmin()
      .from('sliding_cards')
      .update(updatePayload)
      .eq('id', cardId);

    if (error) {
      return { errors: { _form: ["Database Error: Failed to update sliding card."] } };
    }

    revalidatePath("/sr-admin/sliding-cards");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { errors: { _form: ["Network error: Failed to update sliding card."] } };
  }
}

export async function deleteSlidingCard(formData: FormData) {
  const cardId = formData.get('id') as string;
  if (!cardId) return;

  try {
    const { error } = await supabaseAdmin()
      .from('sliding_cards')
      .delete()
      .eq('id', cardId);

    if (error) throw error;

    revalidatePath("/sr-admin/sliding-cards");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: 'Failed to delete sliding card.' };
  }
}

export async function getSlidingCards() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('sliding_cards')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching sliding cards:', error);
    return [];
  }
}

export async function updateProductsBulk(previousState: any, formData: FormData) {
  try {
    const admin = supabaseAdmin();
    // admin client might throw error now if keys missing, which is caught below

    // Safety check just in case types are loose
    if (!admin) throw new Error("Admin client unavailable");

    const updates: { id: string; updates: any }[] = [];
    const ids: Set<string> = new Set();

    // 1. Identify all product IDs from the form
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("id_")) {
        ids.add(String(value));
      }
    }

    // 2. Collect updates for each ID
    for (const id of Array.from(ids)) {
      const regularPrice = formData.get(`reqPrice_${id}`);
      const salePrice = formData.get(`salePrice_${id}`);
      const inventory = formData.get(`inventory_${id}`);
      const name = formData.get(`name_${id}`);
      const category = formData.get(`category_${id}`);
      const badge = formData.get(`badge_${id}`);
      const status = formData.get(`status_${id}`);

      const updateData: any = {};

      if (regularPrice !== null) updateData.regular_price = parseFloat(String(regularPrice));

      // Handle sale price: empty string means null (remove sale)
      if (salePrice !== null) {
        const salePriceStr = String(salePrice).trim();
        updateData.sale_price = salePriceStr === "" ? null : parseFloat(salePriceStr);
      }

      if (inventory !== null) updateData.inventory = parseInt(String(inventory), 10);

      // Handle new fields
      if (name !== null && String(name).trim()) {
        updateData.name = String(name).trim();
      }

      if (category !== null && String(category).trim()) {
        updateData.category = String(category).trim();
      }

      if (badge !== null) {
        const badgeVal = String(badge).trim();
        updateData.badge = badgeVal === "none" ? null : badgeVal;
      }

      // Switch sends "on" when checked, null when unchecked
      updateData.is_active = status === "on";

      if (Object.keys(updateData).length > 0) {
        updates.push({ id, updates: updateData });
      }
    }

    // 3. Perform updates
    let successCount = 0;
    let errorCount = 0;

    await Promise.all(updates.map(async (item) => {
      const { error } = await admin
        .from('products')
        .update(item.updates)
        .eq('id', item.id);

      if (error) {
        console.error(`Failed to update product ${item.id}`, error);
        errorCount++;
      } else {
        successCount++;
      }
    }));

    revalidatePath("/sr-admin/products");
    revalidatePath("/collections");
    revalidatePath("/");

    if (errorCount > 0) {
      return { success: false, errors: { _form: [`Updated ${successCount} products, but ${errorCount} failed.`] } };
    }

    return { success: true, message: `Successfully updated ${successCount} products.` };
  } catch (error: any) {
    console.error("Bulk update error:", error);
    return { success: false, errors: { _form: ["Failed to process bulk update."] } };
  }
}

const createSiteImageSchema = z.object({
  section: z.string(),
  customId: z.string().optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  buttonText: z.string().optional(),
});

export async function createSiteImage(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  console.log('[ServerAction] createSiteImage started', rawData);

  const validatedFields = createSiteImageSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
    return { error: "Validation failed. Please check inputs." };
  }

  const { section, customId, imageUrl, linkUrl, name, description, buttonText } = validatedFields.data;

  let newId = customId || '';

  // Auto-generate ID if customId is not provided
  if (!newId && section !== 'other') {
    const supabase = supabaseAdmin();
    // Fetch existing IDs for this section to find the next number
    const { data: existingImages, error } = await supabase
      .from('site_images')
      .select('id')
      .ilike('id', `${section}-%`);

    if (error) {
      console.error("Error fetching existing images for ID generation:", error);
      return { error: "Database error during ID generation." };
    }

    // specific logic for dual-banner (only 1 and 2)
    if (section === 'dual-banner') {
      const has1 = existingImages.some(img => img.id === 'dual-banner-1');
      const has2 = existingImages.some(img => img.id === 'dual-banner-2');
      if (!has1) newId = 'dual-banner-1';
      else if (!has2) newId = 'dual-banner-2';
      else return { error: "Both dual banners already exist. Edit them instead." };
    } else {
      // Find max number
      let maxNum = 0;
      existingImages.forEach(img => {
        const parts = img.id.split('-');
        const num = parseInt(parts[parts.length - 1]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      newId = `${section}-${maxNum + 1}`;
    }
  }

  if (!newId) return { error: "ID could not be generated and custom ID missing." };

  const supabase = supabaseAdmin();
  const newImage: Partial<SiteImage> = {
    id: newId,
    imageUrl,
    linkUrl: linkUrl || undefined,
    name: name || undefined,
    description: description || undefined,
    buttonText: buttonText || undefined,
    isVisible: true
  };

  const { error } = await supabase.from('site_images').insert(newImage);

  if (error) {
    console.error("Failed to insert site image:", error);
    return { error: "Failed to create image in database." };
  }

  revalidatePath("/sr-admin/site-images");
  revalidatePath("/"); // Revalidate homepage
  return { success: true, id: newId };
}

export async function getQuestionsAdmin(): Promise<ProductQuestion[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('product_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('getQuestionsAdmin error:', e);
    return [];
  }
}

export async function updateQuestionStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabaseAdmin()
      .from('product_questions')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/sr-admin/questions');
    revalidatePath('/[category]/[product]', 'page');
    return { success: true };
  } catch (e: any) {
    console.error('updateQuestionStatus error:', e);
    return { success: false, message: e.message };
  }
}

export async function answerQuestion(id: string, answer: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabaseAdmin()
      .from('product_questions')
      .update({ answer })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/sr-admin/questions');
    revalidatePath('/[category]/[product]', 'page');
    return { success: true };
  } catch (e: any) {
    console.error('answerQuestion error:', e);
    return { success: false, message: e.message };
  }
}

export async function deleteQuestion(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabaseAdmin()
      .from('product_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/sr-admin/questions');
    revalidatePath('/[category]/[product]', 'page');
    return { success: true };
  } catch (e: any) {
    console.error('deleteQuestion error:', e);
    return { success: false, message: e.message };
  }
}

export async function getApprovedQuestions(productId: string): Promise<ProductQuestion[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('product_questions')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved questions:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('getApprovedQuestions error:', e);
    return [];
  }
}

export async function submitQuestion(productId: string, customerName: string, question: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabaseAdmin()
      .from('product_questions')
      .insert({
        product_id: productId,
        customer_name: customerName,
        question: question,
        status: 'pending' // Default to pending
      });

    if (error) throw error;

    // We don't revalidate immediately because it's pending approval and shouldn't be visible yet
    return { success: true };
  } catch (e: any) {
    console.error('submitQuestion error:', e);
    return { success: false, message: e.message };
  }
}
