
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // GET: List all blog posts
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('published_at', { ascending: false });

            if (error) throw error;

            // Transform snake_case to camelCase
            const transformedData = (data || []).map((post: any) => ({
                ...post,
                imageUrl: post.image_url || null,
                readTime: post.read_time || '5 min read',
                date: post.published_at || post.created_at, // Use published_at if available
                createdAt: post.created_at,
                imageKey: post.image_key,
            }));

            return new Response(JSON.stringify(transformedData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // POST: Create / Update / Delete
        if (req.method === 'POST') {
            const payload = await req.json();
            const action = payload.action || 'create';

            if (action === 'create') {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .insert(payload.data || payload)
                    .select()
                    .maybeSingle();

                if (error) throw error;

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (action === 'update') {
                const { id, ...updates } = payload.data;
                const { data, error } = await supabase
                    .from('blog_posts')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .maybeSingle();

                if (error) throw error;

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (action === 'delete') {
                const { id } = payload;
                const { error } = await supabase
                    .from('blog_posts')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: 'Invalid action' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
