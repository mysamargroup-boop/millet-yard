import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp-cloud';

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication for viewing orders
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      // If it's a 401 response, check if x-api-key is provided (for compatibility with Worker)
      const apiKey = req.headers.get('x-api-key');
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return authResult;
      }
    }

    const supabase = supabaseAdmin();
    // Direct Supabase query for local development reliability
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders || []);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orderData = await req.json();
    const { items, couponCode, customer_phone, customer_name, customer_address, external_order_id } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // 1. Fetch Products to Validate Prices
    const productIds = items.map((item: any) => item.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, regular_price, sale_price, cost_price, name')

      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json({ error: "Failed to fetch products for validation" }, { status: 500 });


    }

    // 2. Calculate Server-Side Total
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.id);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 400 });
      }

      // Logic: Use sale_price if available, otherwise regular_price check not needed if price column is maintained, 
      // but let's replicate the robust logic: effective price is sale_price || regular_price
      // Note: The 'price' column in DB usually stores the effective selling price.
      // Let's use the same logic as the worker: product.sale_price || product.regular_price || 0
      const price = product.sale_price || product.regular_price || 0;
      const quantity = item.quantity || 1;

      calculatedTotal += price * quantity;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.id,
        quantity: quantity,
        unit_price: price, // Store the price WE calculated
        unit_cost_price: product.cost_price || null,
        total_price: price * quantity
      });
    }

    // 3. Fetch Site Settings for COD Validation
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('cod_enabled, cod_extra_fee, cod_min_order_amount, contact_email')
      .maybeSingle();

    // 4. Validate Coupon and Calculate Discount (Server-Side)
    let discountAmount = 0;
    let validatedCouponCode = null;

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (coupon) {
        validatedCouponCode = coupon.code;
        if (coupon.type === 'percent') {
          discountAmount = (calculatedTotal * (coupon.value / 100));
        } else if (coupon.type === 'flat') {
          discountAmount = coupon.value;
        }
        // Cap discount
        discountAmount = Math.min(calculatedTotal, discountAmount);
      }
    }

    // 5. Apply COD Fee if applicable
    let codFee = 0;
    const isCOD = orderData.payment_method === 'COD' || orderData.paymentMethod === 'cod'; // Handle both casing/naming

    if (isCOD) {
      if (!siteSettings?.cod_enabled) {
        return NextResponse.json({ error: "Cash on Delivery is currently disabled." }, { status: 400 });
      }

      const currentTotal = calculatedTotal - discountAmount;

      if (siteSettings.cod_min_order_amount && currentTotal < siteSettings.cod_min_order_amount) {
        return NextResponse.json({
          error: `Minimum order amount for COD is ₹${siteSettings.cod_min_order_amount}`
        }, { status: 400 });
      }

      if (siteSettings.cod_extra_fee) {
        codFee = Number(siteSettings.cod_extra_fee);
      }
    }

    const finalAmount = Math.max(0, calculatedTotal - discountAmount + codFee);

    // Fix customer_email: If null, use customerPhone@domain
    let customerEmail = orderData.customer_email || orderData.customerEmail;
    if (!customerEmail && customer_phone) {
      const domain = siteSettings?.contact_email ? siteSettings.contact_email.split('@')[1] : 'milletyard.com';
      customerEmail = `${customer_phone}@${domain}`;
    }

    // Fix payment_status logic
    let initialPaymentStatus = 'PENDING';
    if (!isCOD && orderData.isAdmin && orderData.payment_status) {
      initialPaymentStatus = orderData.payment_status.toUpperCase();
    }

    // 6. Create Order with Validated Amounts
    // Check for existing first
    if (external_order_id) {
      const { data: existing } = await supabase.from('orders').select('*').eq('external_order_id', external_order_id).single();
      if (existing) return NextResponse.json(existing);
    }

    const orderPayload = {
      external_order_id: external_order_id || `ord_${Date.now()}`,
      customer_name: customer_name || 'Guest',
      customer_phone: customer_phone,
      customer_email: customerEmail,
      customer_address: customer_address,
      status: 'PENDING',
      payment_status: initialPaymentStatus,
      payment_method: isCOD ? 'COD' : 'PREPAID',
      subtotal_amount: calculatedTotal,
      total_amount: finalAmount, // SECURE TOTAL
      shipping_cost: 0,
      extra_note: orderData.extra_note,
      admin_notes: ''
    };

    // Note: 'cod_fee' column might not exist in orders table yet. 
    // If it doesn't, we can just omit it from payload and rely on total_amount.
    // Let's check schema/types or just don't insert it explicitly if not needed, 
    // but better to put it in metadata or admin_notes if we can't add column now.
    // For now, let's append to admin_notes if cod_fee exists
    if (codFee > 0) {
      orderPayload.admin_notes = `COD Fee: ₹${codFee}`;
    }
    // Remove cod_fee from payload to avoid error if column missing
    delete (orderPayload as any).cod_fee;


    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 7. Insert Order Items
    const orderItemsPayload = validatedItems.map(item => ({
      order_id: newOrder.id,
      ...item
    }));

    await supabase.from('order_items').insert(orderItemsPayload);

    // 6. Record Coupon Redemption
    if (validatedCouponCode && discountAmount > 0) {
      await supabase.from('coupon_redemptions').insert({
        order_id: newOrder.id,
        coupon_code: validatedCouponCode,
        discount_amount: discountAmount
      });
    }

    // 7. Send WhatsApp Notification (Optional/Async)
    if (newOrder.customer_phone) {
      try {
        const message = `*Order Confirmed!* \n\nHello ${newOrder.customer_name},\nYour order #${newOrder.external_order_id} has been placed successfully. \nTotal Amount: ₹${newOrder.total_amount}\n\nThank you for shopping with us!`;
        await sendWhatsAppTextMessage({
          to: newOrder.customer_phone,
          body: message
        });
      } catch (wsError) {
        console.error('WhatsApp Notification Error:', wsError);
        // Don't fail the order if WhatsApp fails
      }
    }

    return NextResponse.json(newOrder);

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
