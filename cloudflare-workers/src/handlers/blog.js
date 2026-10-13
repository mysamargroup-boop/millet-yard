import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

export async function handleBlogPosts(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        const supabase = createSupabaseAdmin(env);

        // GET: List all blog posts
        if (request.method === 'GET') {
            return await cachedJson(
                request,
                env,
                async () => {
                    const { data, error } = await supabase
                        .from('blog_posts')
                        .select('*')
                        .order('date', { ascending: false });

                    if (error) throw error;

                    // Transform snake_case to camelCase
                    const transformedData = (data || []).map(post => ({
                        ...post,
                        imageUrl: post.image_url || null,
                        readTime: post.read_time || '5 min read',
                        date: post.date, // already standardized?
                        createdAt: post.created_at,
                        // content, excerpt, title, category, author kept as is
                    }));

                    return new Response(JSON.stringify(transformedData), {
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

        // POST: Create/Update (Admin)
        if (request.method === 'POST') {
            const payload = await request.json();

            if (payload.action === 'create' || !payload.action) {
                const insertData = payload.data || payload;
                // Clean up data if needed?
                // Frontend sends snake_case or camelCase? Usually expects DB format for insert.
                // Let's assume frontend sends DB format or we map it?
                // Given the existing code style, it accepts direct DB column names usually.

                const { data, error } = await supabase
                    .from('blog_posts')
                    .insert(insertData)
                    .select()
                    .maybeSingle();

                if (error) throw error;

                return new Response(JSON.stringify(data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                });
            }

            if (payload.action === 'update') {
                const { id, ...updates } = payload.data;
                const { data, error } = await supabase
                    .from('blog_posts')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .maybeSingle();

                if (error) throw error;

                return new Response(JSON.stringify(data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                });
            }

            if (payload.action === 'delete') {
                const { id } = payload;
                const { error } = await supabase
                    .from('blog_posts')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                });
            }
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
