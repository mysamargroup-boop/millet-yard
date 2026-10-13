import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // Rate limit public requests
    const rl = await checkRateLimit(req, { keyPrefix: 'products_list', limit: 30, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;

    // Public read access - no auth required for GET
    const { getProductsDirect } = await import('@/lib/supabase');
    const products = await getProductsDirect();
    const transformedProducts = products;
    return NextResponse.json(transformedProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit admin actions
    const rl = await checkRateLimit(req, { keyPrefix: 'products_admin', limit: 10, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;

    // Require admin authentication for creating products
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      // If it's a 401 response, check if x-api-key is provided (for compatibility with Worker)
      const apiKey = req.headers.get('x-api-key');
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return authResult;
      }
    }

    const body = await req.json();
    const productData = body.action === 'create' ? body.data : body;

    // Basic input validation
    if (!productData.name || !productData.category_id) {
      return NextResponse.json(
        { error: 'Product name and category_id are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      throw new Error('Supabase Admin client not initialized');
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
