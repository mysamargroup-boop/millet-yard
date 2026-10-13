import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

const ALLOWED_PRODUCT_COLUMNS = [
    'id', 'name', 'description', 'short_description', 'specific_description',
    'regular_price', 'sale_price', 'category_id', 'inventory', 'image_url',
    'image_alt', 'image_hint', 'gallery_images', 'is_featured', 'featured_order',
    'is_popular', 'popular_order', 'is_best_seller', 'best_seller_order',
    'is_new_arrival', 'new_arrival_order', 'review_count', 'average_rating',
    'meta_title', 'meta_description', 'meta_keywords', 'slug', 'sku',
    'weight', 'dimensions', 'shipping_class', 'tax_class', 'attributes',
    'variations', 'upsells', 'cross_sells', 'tags', 'labels', 'created_at', 'updated_at',
    'weight_unit', 'dimension_unit'
];

const ALLOWED_CATEGORY_COLUMNS = [
    'id', 'name', 'description', 'image_url', 'image_hint', 'link_url', 'is_featured', 'featured_order', 'created_at', 'updated_at'
];

function prepareCategoryData(data) {
    const prepared = { ...data };

    // Map frontend camelCase to backend snake_case if necessary
    if (prepared.imageUrl) {
        prepared.image_url = prepared.imageUrl;
        delete prepared.imageUrl;
    }
    if (prepared.imageHint) {
        prepared.image_hint = prepared.imageHint;
        delete prepared.imageHint;
    }
    if (prepared.linkUrl) {
        prepared.link_url = prepared.linkUrl;
        delete prepared.linkUrl;
    }

    // Remove all keys that are NOT in the database schema
    Object.keys(prepared).forEach(key => {
        if (!ALLOWED_CATEGORY_COLUMNS.includes(key)) {
            delete prepared[key];
        }
    });

    return prepared;
}

function prepareProductData(data) {
    const prepared = { ...data };

    // SECURITY: Ensure we don't try to insert 'price' or 'is_active' which doesn't exist in DB
    delete prepared.price;
    delete prepared.is_active;

    // Map frontend camelCase to backend snake_case if necessary
    if (prepared.regularPrice) {
        prepared.regular_price = prepared.regularPrice;
        delete prepared.regularPrice;
    }
    if (prepared.salePrice) {
        prepared.sale_price = prepared.salePrice;
        delete prepared.salePrice;
    }
    if (prepared.categoryId) {
        prepared.category_id = prepared.categoryId;
        delete prepared.categoryId;
    }
    if (prepared.imageUrl) {
        prepared.image_url = prepared.imageUrl;
        delete prepared.imageUrl;
    }
    if (prepared.shortDescription) {
        prepared.short_description = prepared.shortDescription;
        delete prepared.shortDescription;
    }
    if (prepared.specificDescription) {
        prepared.specific_description = prepared.specificDescription;
        delete prepared.specificDescription;
    }

    // Remove all keys that are NOT in the database schema to prevent "column not found" errors
    Object.keys(prepared).forEach(key => {
        if (!ALLOWED_PRODUCT_COLUMNS.includes(key)) {
            delete prepared[key];
        }
    });

    return prepared;
}

// Route handler for products
export async function handleProducts(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);

        if (request.method === 'GET') {
            const result = await cachedJson(
                request,
                env,
                async () => {
                    const { data, error } = await supabase
                        .from('products')
                        .select('*')
                        .not('id', 'is', null)
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform snake_case to camelCase for frontend compatibility
                    const transformedData = (data || []).map(product => ({
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
                        createdAt: product.created_at,
                        updatedAt: product.updated_at,
                    }));

                    return new Response(JSON.stringify(transformedData), {
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

        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
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
        }

        if (request.method === 'POST') {
            const payload = await request.json();
            const insertData = prepareProductData(payload.data || payload);

            if (!insertData.name) {
                return new Response(JSON.stringify({ error: 'Product name is required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { data, error } = await supabase
                .from('products')
                .insert(insertData)
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

        if (request.method === 'PUT') {
            const payload = await request.json();
            const updateData = prepareProductData(payload.data || payload);
            const id = updateData.id || (payload.data ? payload.data.id : payload.id);

            if (!id) {
                return new Response(JSON.stringify({ error: 'Product ID required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
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

        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');

            if (!id) {
                return new Response(JSON.stringify({ error: 'Product ID required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { error } = await supabase
                .from('products')
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

// Route handler for products-admin (legacy/action-based)
export async function handleProductsAdmin(request, env) {
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

        if (payload.action === 'list') {
            const { data, error } = await supabase
                .from('products')
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

        if (payload.action === 'create' || payload.action === 'update') {
            const productData = prepareProductData(payload.data || {});

            let query;
            if (payload.action === 'create') {
                if (!productData.name) throw new Error('Product name is required');
                query = supabase.from('products').insert(productData);
            } else {
                const id = productData.id || payload.id;
                if (!id) throw new Error('Product ID required for update');
                query = supabase.from('products').update(productData).eq('id', id);
            }

            const { data, error } = await query.select().maybeSingle();

            if (error) {
                console.error(`Supabase Product ${payload.action} Error:`, error);
                throw error;
            }

            return new Response(JSON.stringify(data || null), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (payload.action === 'delete') {
            const id = payload.id || (payload.data && payload.data.id);
            if (!id) throw new Error('Product ID required for delete');

            const { error } = await supabase.from('products').delete().eq('id', id);
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


export async function handleCategories(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);

        if (request.method === 'GET') {
            const result = await cachedJson(
                request,
                env,
                async () => {
                    const { data, error } = await supabase
                        .from('categories')
                        .select('*')
                        .order('name');

                    if (error) throw error;

                    // Transform snake_case to camelCase for frontend compatibility
                    const transformedData = (data || []).map(cat => ({
                        ...cat,
                        imageUrl: cat.image_url || null,
                        imageHint: cat.image_hint || '',
                        linkUrl: cat.link_url || null,
                        is_featured: cat.is_featured || false,
                        featured_order: cat.featured_order || 0,
                        createdAt: cat.created_at,
                        updatedAt: cat.updated_at,
                    }));

                    return new Response(JSON.stringify(transformedData), {
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

        let payload = {};
        try {
            const json = await request.json();
            payload = json || {};
        } catch {
            payload = { action: 'list' };
        }

        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
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

        if (payload.action === 'list' || payload.action === undefined) {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (payload.action === 'create') {
            const categoryData = prepareCategoryData(payload.data || {});
            if (!categoryData.name) throw new Error('Category name is required');

            const { data, error } = await supabase
                .from('categories')
                .insert(categoryData)
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

        if (payload.action === 'update') {
            const categoryData = prepareCategoryData(payload.data || {});
            const id = categoryData.id || (payload.data && payload.data.id);

            if (!id) {
                return new Response(JSON.stringify({ error: 'Category ID required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { data, error } = await supabase
                .from('categories')
                .update(categoryData)
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

        if (payload.action === 'delete') {
            const { id } = payload.data || {};
            if (!id) {
                return new Response(JSON.stringify({ error: 'Category ID required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            const { error } = await supabase
                .from('categories')
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
