import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = (body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    if (coupon.min_cart_value && subtotal < coupon.min_cart_value) {
      return NextResponse.json({
        error: `Minimum order value of ₹${coupon.min_cart_value} required for coupon ${coupon.code}`
      }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = Math.min(coupon.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountAmount: discount,
      type: coupon.type,
      value: coupon.value,
      message: `Coupon ${coupon.code} applied! You saved ₹${discount}.`
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
