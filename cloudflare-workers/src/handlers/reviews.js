import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

export async function handleReviews(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);
        const url = new URL(request.url);
        const productId = url.searchParams.get('product_id');

        if (request.method === 'GET') {
            const result = await cachedJson(
                request,
                env,
                async () => {
                    let query = supabase
                        .from('reviews')
                        .select('*')
                        .eq('is_approved', true);

                    if (productId) {
                        query = query.eq('product_id', productId);
                    }

                    const { data, error } = await query.order('created_at', { ascending: false });

                    if (error) throw error;

                    const transformed = (data || []).map(r => ({
                        ...r,
                        author_name: r.customer_name,
                        is_verified: r.is_approved,
                    }));

                    return new Response(JSON.stringify(transformed || []), {
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
        }

        if (request.method === 'POST') {
            const reviewData = await request.json();

            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    product_id: reviewData.product_id,
                    rating: reviewData.rating,
                    review_text: reviewData.comment || reviewData.review_text,
                    customer_name: reviewData.customer_name,
                    is_approved: false,
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

        if (request.method === 'PUT' || request.method === 'DELETE') {
            // Check admin authentication for review approval or deletion
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
        }

        if (request.method === 'PUT') {
            const reviewData = await request.json();
            const { reviewId, isApproved } = reviewData;

            if (!reviewId) {
                return new Response(JSON.stringify({ error: 'Review ID required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { data, error } = await supabase
                .from('reviews')
                .update({
                    is_approved: isApproved,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId)
                .select()
                .maybeSingle();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const reviewId = url.searchParams.get('id');

            if (!reviewId) {
                return new Response(JSON.stringify({ error: 'Review ID required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

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
