import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

export async function handleSiteImages(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);

        // GET: Public read access
        if (request.method === 'GET') {
            return await cachedJson(
                request,
                env,
                async () => {
                    const { data, error } = await supabase
                        .from('site_images')
                        .select('*')
                        .order('id');

                    if (error) throw error;

                    // Transform snake_case to camelCase for frontend compatibility
                    const transformedData = (data || []).map(img => ({
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

                    return new Response(JSON.stringify(transformedData), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': getCacheControl(env),
                            ...getCORSHeaders(env, request),
                        },
                    });
                },
                { cacheControl: getCacheControl(env) }
            );
        }

        // POST: Update images (requires admin auth)
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

            const imageData = await request.json();

            const { data, error } = await supabase
                .from('site_images')
                .update({
                    image_url: imageData.imageUrl,
                    image_hint: imageData.imageHint,
                    updated_at: new Date().toISOString()
                })
                .eq('id', imageData.id)
                .select()
                .single();

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

export async function handleSlidingCards(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);

        // GET: Public read access
        if (request.method === 'GET') {
            return await cachedJson(
                request,
                env,
                async () => {
                    const { data, error } = await supabase
                        .from('sliding_cards')
                        .select('*')
                        .eq('active', true)
                        .order('order_num');

                    if (error) throw error;

                    return new Response(JSON.stringify(data || []), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': getCacheControl(env),
                            ...getCORSHeaders(env, request),
                        },
                    });
                },
                { cacheControl: getCacheControl(env) }
            );
        }

        // POST: Create card (requires admin auth)
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

            const cardData = await request.json();

            const { data, error } = await supabase
                .from('sliding_cards')
                .insert({
                    title: cardData.title,
                    description: cardData.description,
                    image_url: cardData.imageUrl,
                    image_hint: cardData.imageHint,
                    link_url: cardData.linkUrl,
                    active: true,
                    order_num: cardData.orderNum || 0
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        // DELETE: Delete card (requires admin auth)
        if (request.method === 'DELETE') {
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

            const url = new URL(request.url);
            const id = url.searchParams.get('id');

            const { error } = await supabase
                .from('sliding_cards')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
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
