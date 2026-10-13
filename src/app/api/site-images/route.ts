import { NextRequest, NextResponse } from 'next/server';
import { getSiteImagesDirect } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Direct Supabase call with anon key for fast read
    const siteImages = await getSiteImagesDirect();
    return NextResponse.json(siteImages);
  } catch (error: any) {
    console.error('Error fetching site images:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication for updating site images
    const { requireAdminAuth } = await import('@/lib/auth-middleware');
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const imageData = await req.json();

    // Input validation
    if (!imageData.id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }
    
    // For admin operations, use service role key (server-side only)
    const { createSupabaseAdminClient } = await import('@/lib/supabase');
    const supabase = createSupabaseAdminClient();

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
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating site image:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
