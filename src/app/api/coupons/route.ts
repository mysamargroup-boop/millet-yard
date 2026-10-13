import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/auth-middleware';

/**
 * Handles GET requests to fetch all discount coupons.
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin authentication for viewing coupons
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const { data, error } = await supabaseAdmin()
      .from('coupons')
      .select('*')
      .order('code');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handles POST requests to create/update discount coupons.
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin authentication for managing coupons
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const body = await req.json();
    const { action, data } = body;
    const supabase = supabaseAdmin();

    if (action === 'create' || action === 'update') {
      const { code, type, value, show_on_offers_page, originalCode } = data;

      // Input validation
      if (!code || !type || value === undefined) {
        return NextResponse.json(
          { error: 'Code, type, and value are required' },
          { status: 400 }
        );
      }

      if (type !== 'percent' && type !== 'flat') {
        return NextResponse.json(
          { error: 'Type must be "percent" or "flat"' },
          { status: 400 }
        );
      }

      if (value <= 0 || (type === 'percent' && value > 100)) {
        return NextResponse.json(
          { error: 'Invalid value. Percent must be 0-100, flat must be positive' },
          { status: 400 }
        );
      }

      const payload: any = {
        code,
        type,
        value,
        show_on_offers_page
      };

      let query;
      if (action === 'update' && originalCode) {
        query = supabase.from('coupons').update(payload).eq('code', originalCode);
      } else {
        query = supabase.from('coupons').insert(payload);
      }

      const { data: result, error } = await query.select().single();

      if (error) throw error;
      return NextResponse.json(result);
    }

    if (action === 'list') {
      const { data, error } = await supabase.from('coupons').select('*').order('code');
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error managing coupon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
