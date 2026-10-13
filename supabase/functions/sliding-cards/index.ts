
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
                .from('sliding_cards')
                .select('*')
                .eq('active', true)
                .order('order_num');

            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'POST') {
            const cardData = await req.json();
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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'DELETE') {
            const url = new URL(req.url);
            const id = url.searchParams.get('id');

            const { error } = await supabase.from('sliding_cards').delete().eq('id', id);
            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
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
