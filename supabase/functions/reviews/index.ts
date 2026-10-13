
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

        const url = new URL(req.url);

        if (req.method === 'GET') {
            const productId = url.searchParams.get('product_id');
            let query = supabase.from('reviews').select('*');

            if (productId) {
                query = query.eq('product_id', productId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'POST') {
            const reviewData = await req.json();
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    product_id: reviewData.product_id,
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    customer_name: reviewData.customer_name,
                    is_approved: false, // Default to unapproved
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'PUT') {
            // Used for approving reviews (admin)
            const reviewData = await req.json();
            const { reviewId, isApproved } = reviewData;

            if (!reviewId) throw new Error("Review ID required");

            const { data, error } = await supabase
                .from('reviews')
                .update({
                    is_approved: isApproved,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                status: 200,
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
