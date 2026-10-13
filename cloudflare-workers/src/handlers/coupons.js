import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';

// Public coupon validation handler
export async function handleCoupons(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    try {
        const payload = await request.json();
        const supabase = createSupabaseAdmin(env);

        // VALIDATE action (public)
        if (payload.action === 'validate') {
            const { code, cartAmount, items } = payload;

            if (!code) {
                return new Response(JSON.stringify({ valid: false, message: 'Coupon code required' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
                });
            }

            const { data: coupon, error: couponError } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('active', true)
                .maybeSingle();

            if (couponError) throw couponError;
            if (!coupon) {
                return new Response(JSON.stringify({ valid: false, message: 'Invalid or inactive coupon' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
                });
            }

            // Calculate discount
            let discountAmount = 0;
            const subtotal = cartAmount || 0;

            if (coupon.type === 'percent') {
                discountAmount = (subtotal * coupon.value) / 100;
            } else {
                discountAmount = coupon.value;
            }

            if (discountAmount > subtotal) discountAmount = subtotal;

            return new Response(
                JSON.stringify({
                    valid: true,
                    code: coupon.code,
                    discountAmount,
                    subtotal,
                    finalAmount: subtotal - discountAmount,
                    message: 'Coupon applied successfully',
                    type: coupon.type,
                    value: coupon.value
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
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

export async function handleCouponsAdmin(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

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

    // Add GET method support for listing coupons
    if (request.method === 'GET') {
        try {
            const supabase = createSupabaseAdmin(env);
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    try {
        const payload = await request.json();
        const supabase = createSupabaseAdmin(env);

        // LIST
        if (payload.action === 'list') {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        // CREATE
        if (payload.action === 'create') {
            const { data, error } = await supabase
                .from('coupons')
                .insert(payload.data)
                .select()
                .maybeSingle();

            if (error) throw error;

            return new Response(JSON.stringify(data || null), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        // UPDATE
        if (payload.action === 'update') {
            const { id, ...updates } = payload.data;
            const { data, error } = await supabase
                .from('coupons')
                .update(updates)
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;

            return new Response(JSON.stringify(data || null), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        // DELETE
        if (payload.action === 'delete') {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', payload.id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        // TOGGLE STATUS
        if (payload.action === 'toggle-status') {
            const { id, active } = payload;
            const { data, error } = await supabase
                .from('coupons')
                .update({ active })
                .eq('id', id)
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

        // TOGGLE VISIBILITY
        if (payload.action === 'toggle-visibility') {
            const { id, isVisible } = payload;
            const { data, error } = await supabase
                .from('coupons')
                .update({ is_visible: isVisible })
                .eq('id', id)
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

        // VALIDATE
        if (payload.action === 'validate') {
            const { code, cartAmount, items } = payload;

            // 1. Fetch Coupon
            const { data: coupon, error: couponError } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('active', true)
                .maybeSingle();

            if (couponError) throw couponError;
            if (!coupon) {
                return new Response(JSON.stringify({ valid: false, message: 'Invalid or inactive coupon' }), {
                    status: 200, // Return 200 with valid:false for logic handling
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
                });
            }

            // 2. Helper to check if coupon applies to ALL items? Or ANY? 
            // Usually coupons apply to subtotal. 
            // Logic: Calculate discount based on server-side prices.

            // Fetch real prices from database
            const productIds = items.map(item => item.product_id);
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, regular_price, sale_price')
                .in('id', productIds);

            if (productsError) throw productsError;

            // Calculate actual subtotal
            let actualSubtotal = 0;
            items.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                    const price = product.sale_price || product.regular_price || 0;
                    actualSubtotal += price * (item.quantity || 1);
                }
            });

            // Apply coupon to actual subtotal
            let discountAmount = 0;
            if (coupon.type === 'percent') {
                discountAmount = (actualSubtotal * coupon.value) / 100;
            } else {
                discountAmount = coupon.value;
            }

            // Cap discount?
            if (discountAmount > actualSubtotal) discountAmount = actualSubtotal;

            return new Response(
                JSON.stringify({
                    valid: true,
                    code: coupon.code,
                    discountAmount,
                    subtotal: actualSubtotal,
                    finalAmount: actualSubtotal - discountAmount,
                    message: 'Coupon applied successfully',
                    type: coupon.type,
                    value: coupon.value
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
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
