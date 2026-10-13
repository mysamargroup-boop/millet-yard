
// This file defines API endpoints for managing product categories.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Handles GET requests to fetch all product categories.
 * @returns {NextResponse} A JSON response with the list of categories or an error message.
 */
export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, { keyPrefix: 'categories_list', limit: 50, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;
    // Direct Supabase call with anon key for fast read
    const { getCategoriesDirect } = await import('@/lib/supabase');
    const categories = await getCategoriesDirect();

    // Transform to match expected format
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl || 'https://placehold.co/96x96?text=Category',
      imageHint: cat.imageHint || '',
      linkUrl: cat.linkUrl || null,
      is_featured: cat.is_featured || false,
      featured_order: cat.featured_order || 0,
      is_trending: cat.is_trending || false,
    }));

    return NextResponse.json(transformedCategories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new product category.
 * @param {NextRequest} req The incoming request object.
 * @returns {NextResponse} A JSON response with the newly created category or an error message.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, { keyPrefix: 'categories_admin', limit: 20, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;
    // Require admin authentication for creating categories
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      // If it's a 401 response, check if x-api-key is provided (for compatibility with Worker)
      const apiKey = req.headers.get('x-api-key');
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return authResult;
      }
    }

    const body = await req.json();
    const categoryData = body.action === 'create' ? body.data : body;

    // Basic input validation
    if (!categoryData.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      throw new Error('Supabase Admin client not initialized');
    }

    // Direct insert to Supabase
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
