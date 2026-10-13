import { NextRequest, NextResponse } from 'next/server';
import { getSlidingCardsDirect } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Direct Supabase call with anon key for fast read
    const slidingCards = await getSlidingCardsDirect();
    return NextResponse.json(slidingCards);
  } catch (error: any) {
    console.error('Error fetching sliding cards:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication for creating sliding cards
    const { requireAdminAuth } = await import('@/lib/auth-middleware');
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const cardData = await req.json();

    // Input validation
    if (!cardData.title) {
      return NextResponse.json(
        { error: 'Card title is required' },
        { status: 400 }
      );
    }
    
    // For admin operations, use service role key (server-side only)
    const { createSupabaseAdminClient } = await import('@/lib/supabase');
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('sliding_cards')
      .insert({
        title: cardData.title,
        description: cardData.description,
        image_url: cardData.imageUrl,
        image_hint: cardData.imageHint,
        link_url: cardData.linkUrl,
        order_num: cardData.orderNum || 0,
        active: cardData.active !== false
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating sliding card:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
