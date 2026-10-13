import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, { keyPrefix: 'sitesettings_view', limit: 100, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;
    // Direct Supabase call for site settings
    const { createSupabaseAdminClient } = await import('@/lib/supabase');
    const supabase = createSupabaseAdminClient();

    // Check if the request is from an authenticated admin
    const { requireAdminAuth } = await import('@/lib/auth-middleware');
    const authResult = await requireAdminAuth(req);
    const isAdmin = !(authResult instanceof NextResponse);

    // If admin, allow all fields. Otherwise, restrict to public-safe fields only.
    const selectFields = isAdmin ? '*' : `
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
      owner_first_name,
      owner_last_name,
      hero_enabled,
      hero_title,
      hero_subtitle,
      hero_button_text,
      hero_button_link,
      updated_at
    `;

    const { data, error } = await supabase
      .from('site_settings')
      .select(selectFields)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(data || {});
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, { keyPrefix: 'sitesettings_admin', limit: 10, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;
    // Require admin authentication for updating site settings
    const { requireAdminAuth } = await import('@/lib/auth-middleware');
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const settingsData = await req.json();

    // Add CF Access headers for server-side calls
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add CF Access headers if available
    if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
      headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
      headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
    }

    // Add API Key for admin endpoints
    const apiKey = process.env.API_KEY || process.env.WORKER_API_KEY;
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${API.SITE_SETTINGS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update', data: settingsData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update site settings');
    }

    const settings = await response.json();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
