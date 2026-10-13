// Public site settings - only safe data exposed via anon key
import { createClient } from '@supabase/supabase-js'
import type { SiteSettings } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Public-safe site settings from main table with column filtering
export async function getPublicSiteSettings(): Promise<Partial<SiteSettings>> {
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
      updated_at
    `)
    .maybeSingle();

  if (error) throw error;
  return data || {};
}

// Get logo URL directly (public safe)
export async function getLogoUrl(): Promise<string> {
  const settings = await getPublicSiteSettings();
  return settings.logo_url || '';
}
