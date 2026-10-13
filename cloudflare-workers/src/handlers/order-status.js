import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { getOrderStatusMessage } from '../utils/helpers';

// Route handler for order-status
export async function handleOrderStatus(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    try {
        let orderId = url.searchParams.get('order_id') || url.searchParams.get('orderId');
        let customerPhone = url.searchParams.get('phone') || url.searchParams.get('customer_phone');

        if (request.method === 'POST') {
            const body = await request.json();
            orderId = (body && (body.orderId || body.order_id)) || orderId;
            customerPhone = (body && (body.phone || body.customer_phone)) || customerPhone;
        }

        const supabase = createSupabaseAdmin(env);

        if (!orderId) {
            if (customerPhone) {
                // Fetch all orders for this phone
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select(`
          *,
          order_items (*)
        `)
                    .eq('customer_phone', customerPhone)
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;

                return new Response(JSON.stringify({ orders: orders || [] }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            return new Response(
                JSON.stringify({ error: 'Missing parameter: order_id or phone' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                },
            );
        }

        // 1. Fetch order from database (always)
        const { data: dbOrder, error: dbError } = await supabase
            .from('orders')
            .select(`
      *,
      order_items (
        *,
        customer_uploaded_images
      )
    `)
            .eq('external_order_id', orderId)
            .maybeSingle();

        // 2. If phone provided, verify it matches order (for guest upload viewing)
        if (customerPhone && dbOrder) {
            const normalizedInputPhone = String(customerPhone).replace(/\D/g, '').slice(-10);
            const normalizedOrderPhone = String(dbOrder.customer_phone).replace(/\D/g, '').slice(-10);

            if (normalizedInputPhone !== normalizedOrderPhone) {
                return new Response(
                    JSON.stringify({ error: 'Phone number does not match order' }),
                    {
                        status: 403,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getCORSHeaders(env, request),
                        },
                    },
                );
            }
        }

        // 3. Fetch payment status from Cashfree
        const envType = env.CASHFREE_ENV?.trim().toUpperCase() || 'SANDBOX';
        const baseUrl = envType === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
        const appId = env.CASHFREE_APP_ID?.trim();
        const secretKey = env.CASHFREE_SECRET_KEY?.trim();

        let cashfreeData = null;
        if (appId && secretKey) {
            try {
                const response = await fetch(`${baseUrl}/orders/${orderId}`, {
                    method: 'GET',
                    headers: {
                        'x-api-version': '2023-08-01',
                        'x-client-id': appId,
                        'x-client-secret': secretKey,
                    },
                });
                if (response.ok) {
                    cashfreeData = await response.json();
                }
            } catch (e) {
                console.error('Cashfree fetch error:', e);
            }
        }

        // 4. Build response (hide sensitive data unless phone verified)
        const includeUploads = !!customerPhone; // Only include uploads if phone verified

        const result = {
            order_id: orderId,
            order_status: cashfreeData?.order_status || dbOrder?.status || 'UNKNOWN',
            payment_status: dbOrder?.payment_status || 'PENDING',
            payment_session_id: cashfreeData?.payment_session_id || null,
            payments_url: cashfreeData?.payments?.url || null,

            // DB order details
            customer_name: dbOrder?.customer_name,
            total_amount: dbOrder?.total_amount,
            created_at: dbOrder?.created_at,

            // Items (include uploads only if phone verified)
            items: includeUploads ? (dbOrder?.order_items || []) : (dbOrder?.order_items || []).map(item => ({
                ...item,
                customer_uploaded_images: undefined // Hide uploads without phone
            })),

            // Status display message
            status_message: getOrderStatusMessage(cashfreeData?.order_status || dbOrder?.status),
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });
    } catch (error) {
        const message =
            error && typeof error === 'object' && 'message' in error
                ? String(error.message)
                : 'Unknown error';

        return new Response(
            JSON.stringify({
                error: `Failed to fetch order status: ${message}`,
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            },
        );
    }
}
