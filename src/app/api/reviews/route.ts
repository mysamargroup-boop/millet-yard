import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    
    // Direct Supabase call with anon key for fast read
    const { createSupabaseClient } = await import('@/lib/supabase');
    const supabase = createSupabaseClient();
    
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true);
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform to match expected format
    const transformedReviews = (data || []).map(r => ({ 
      ...r, 
      author_name: r.customer_name, 
      is_verified: r.is_approved 
    }));
    
    return NextResponse.json(transformedReviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reviewData = await req.json();
    
    // Call Cloudflare Workers instead of direct Supabase
    const response = await fetch(API.REVIEWS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      // Fallback to direct Supabase if Workers fail
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: reviewData.product_id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          customer_name: reviewData.customer_name,
          is_approved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const review = await response.json();
    return NextResponse.json(review);
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Require admin authentication for approving/rejecting reviews
    const { requireAdminAuth } = await import('@/lib/auth-middleware');
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const { reviewId, isApproved } = await req.json();

    // Input validation
    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Use service role key (server-side only, not exposed to client)
    const { supabaseAdmin } = await import('@/lib/supabase');
    const supabase = supabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ 
        is_approved: isApproved,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
