
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
            const { data, error } = await supabase.from('site_images').select('*').order('id');
            if (error) throw error;

            const transformedData = (data || []).map((img: any) => ({
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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'POST') {
            const imageData = await req.json();
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
