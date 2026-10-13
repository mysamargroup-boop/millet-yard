'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateReviewData {
    product_id: string;
    customer_name: string;
    rating: number;
    comment: string;
}

export async function createReviewAction(data: CreateReviewData) {
    try {
        const { error } = await supabase
            .from('reviews')
            .insert({
                product_id: data.product_id,
                customer_name: data.customer_name,
                rating: data.rating,
                comment: data.comment,
                is_approved: false // Always requires approval
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error submitting review:', error);
        return { success: false, error: 'Failed to submit review' };
    }
}
