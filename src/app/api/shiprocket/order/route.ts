
import { NextRequest, NextResponse } from 'next/server';
import { getShippingProvider } from '@/lib/shipping';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // 1. Fetch Order Details from Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .eq('external_order_id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Map Supabase Order to Shipping OrderData
        // Note: You'll need to adjust this mapping based on your actual DB schema
        const orderData = {
            orderId: order.external_order_id,
            orderDate: order.created_at,
            pickupLocation: 'Primary', // Default pickup location configured in Shiprocket
            billingCustomerName: order.customer_name,
            billingLastname: '', // Split name if needed
            billingAddress: order.customer_address || order.billing_address || 'Not Provided',
            billingCity: order.billing_city || 'Not Provided',
            billingPincode: (order.customer_address && order.customer_address.match(/(\d{6})/) ? order.customer_address.match(/(\d{6})/)[0] : order.billing_pincode) || '000000',
            billingState: order.billing_state || 'Not Provided',
            billingCountry: 'India',
            billingEmail: order.customer_email || 'no-email@example.com',
            billingPhone: order.customer_phone,
            shippingIsBilling: true,
            orderItems: order.order_items.map((item: any) => ({
                name: item.products?.name || 'Product',
                sku: item.products?.id || 'SKU',
                units: item.quantity,
                selling_price: item.unit_price,
                discount: 0,
                tax: 0
            })),
            paymentMethod: order.payment_status === 'PAID' ? 'Prepaid' : 'COD',
            subTotal: order.subtotal_amount,
            length: 10, // Defaults
            breadth: 10,
            height: 10,
            weight: 0.5
        };

        // 3. Create Order via Shipping Provider
        const provider = getShippingProvider();
        const result = await provider.createOrder(orderData as any);

        if (result.success) {
            // Update order with shipment ID?
            // await supabase.from('orders').update({ shipment_id: result.shipmentId }).eq('id', order.id);
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 400 });
        }

    } catch (error: any) {
        console.error('Shipping API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
