
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .not('id', 'is', null) // basic filter
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform snake_case to camelCase
            const transformedData = (data || []).map((product: any) => ({
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
                colorOptions: product.color_options || [], // Ensure new field is mapped
                createdAt: product.created_at,
                updatedAt: product.updated_at,
            }));

            return new Response(JSON.stringify(transformedData), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // POST/Other methods are not supported here (use products-admin)
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
