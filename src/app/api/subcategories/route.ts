import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/auth-middleware';

export async function GET() {
  // Public read access - no auth required for GET
  const supabase = supabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

  const { data, error } = await supabase.from('sub_category').select('*');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication for creating subcategories
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const body = await req.json();

    // Input validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Subcategory name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });
    
    // Try to insert into 'sub_category'
    const { data, error } = await supabase
      .from('sub_category')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
