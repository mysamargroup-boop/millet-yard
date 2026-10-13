import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function GET(req: NextRequest) {
  try {
    // Direct Supabase call with anon key for fast read
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication for creating blog posts
    const { requireAdminAuth } = await import('@/lib/auth-middleware');
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const postData = await req.json();

    // Input validation
    if (!postData.title || !postData.slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Call Cloudflare Workers instead of direct Supabase
    const response = await fetch(API.BLOG_POSTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      // Fallback to direct Supabase if Workers fail
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          slug: postData.slug,
          title: postData.title,
          author: postData.author,
          content: postData.content,
          image_url: postData.imageUrl,
          image_key: postData.imageKey,
          published_at: postData.publishedAt || null
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const blogPost = await response.json();
    return NextResponse.json(blogPost);
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
