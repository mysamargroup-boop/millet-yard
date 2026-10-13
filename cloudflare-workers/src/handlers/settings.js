import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

export async function handleSiteSettings(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);

        // GET: Fetch settings (public read)
        if (request.method === 'GET') {
            const { checkAdminAuth } = await import('../utils/helpers');
            const auth = checkAdminAuth(request, env);
            const isAdmin = auth.valid;

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

            return await cachedJson(
                request,
                env,
                async () => {
                    const { data, error } = await supabase
                        .from('site_settings')
                        .select(selectFields)
                        .single();

                    if (error && error.code !== 'PGRST116') throw error; // Allow not found (return null/empty)

                    return new Response(JSON.stringify(data || {}), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': getCacheControl(env, { browserTtl: 60, edgeTtl: 300 }),
                            ...getCORSHeaders(env, request),
                        },
                    });
                },
                { cacheControl: getCacheControl(env, { browserTtl: 60, edgeTtl: 300 }) }
            );
        }

        // POST: Update settings (requires admin auth)
        if (request.method === 'POST') {
            // Check admin authentication
            const { checkAdminAuth } = await import('../utils/helpers');
            const auth = checkAdminAuth(request, env);
            if (!auth.valid) {
                return new Response(
                    JSON.stringify({ error: auth.error || 'Unauthorized - Admin API key required' }),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getCORSHeaders(env, request),
                        },
                    }
                );
            }

            const updates = await request.json();

            // Check for existing record
            const { data: existing } = await supabase
                .from('site_settings')
                .select('id')
                .maybeSingle();

            let data, error;

            if (existing) {
                const result = await supabase
                    .from('site_settings')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            } else {
                const result = await supabase
                    .from('site_settings')
                    .insert([updates]) // Wrap in array
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            },
        );

    } catch (error) {
        const message =
            error && typeof error === 'object' && 'message' in error
                ? String(error.message)
                : 'Unexpected error';

        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });
    }
}
