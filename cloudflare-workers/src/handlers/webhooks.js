import { createSupabaseAdmin } from '../utils/supabase';
import { sendWhatsAppTemplateMessage, sendSlackNotification } from '../utils/messaging';
import { createShippingOrder, triggerShipping } from '../utils/helpers';
import { hmacSha256Base64, timingSafeEqual } from '../utils/crypto';

// Handler for Cashfree Webhooks
export async function handleCashfreeWebhook(request, env) {
    try {
        const signature = request.headers.get('x-webhook-signature');
        const timestamp = request.headers.get('x-webhook-timestamp');
        
        const rawBody = await request.text();

        // 1. Verify Signature
        if (env.CASHFREE_CLIENT_SECRET) {
            // Cashfree V3: signature = HMAC-SHA256(timestamp + payload, secret)
            // Some versions just use payload. Let's try to be robust.
            const message = timestamp ? timestamp + rawBody : rawBody;
            const expectedSignature = await hmacSha256Base64(env.CASHFREE_CLIENT_SECRET, message);
            
            if (!signature || !timingSafeEqual(signature, expectedSignature)) {
                console.error('Cashfree Webhook: Invalid Signature');
                return new Response('Invalid Signature', { status: 401 });
            }
        } else {
            console.warn('CASHFREE_CLIENT_SECRET not set, skipping signature verification');
        }

        // 2. Parse Body
        let payload;
        try {
            // Cashfree usually sends JSON for V3
            payload = JSON.parse(rawBody);
        } catch (e) {
            // Fallback for form-urlencoded
            const params = new URLSearchParams(rawBody);
            payload = Object.fromEntries(params.entries());
        }

        console.log('Cashfree Webhook Data:', payload);


        const orderId = payload.data?.order?.order_id || payload.orderId;
        const paymentStatus = payload.data?.payment?.payment_status || payload.paymentStatus;

        // Cashfree V2/V3 structure varies.
        // If it's V3, payload.data.order.order_id
        // If V2, it might be flat.
        // Let's assume the payload structure from logs or original code.
        // Original code didn't show explicit parsing, just `parsedBody`.

        // CRITICAL: Supabase update
        if (orderId) {
            const supabase = createSupabaseAdmin(env);

            // Map status
            let dbStatus = 'PENDING';
            if (paymentStatus === 'SUCCESS') dbStatus = 'PAID';
            else if (paymentStatus === 'FAILED') dbStatus = 'FAILED';
            else if (paymentStatus === 'USER_DROPPED') dbStatus = 'FAILED';

            if (dbStatus === 'PAID') {
                await supabase
                    .from('orders')
                    .update({
                        payment_status: 'PAID',
                        status: 'CONFIRMED', // Auto confirm on payment
                        updated_at: new Date().toISOString()
                    })
                    .eq('external_order_id', orderId);

                // Trigger Shipping Order Creation
                await triggerShipping(env, orderId);

                // Send WhatsApp Confirmation
                // Fetch order details for phone number
                const { data: order } = await supabase.from('orders').select('*').eq('external_order_id', orderId).single();
                if (order && order.customer_phone) {
                    await sendWhatsAppTemplateMessage(env, {
                        to: order.customer_phone,
                        templateName: 'order_confirmation', // Ensure this exists
                        languageCode: 'en',
                        bodyParameters: [order.customer_name || 'Customer', orderId],
                    });
                }

                // Send Slack Notification
                await sendSlackNotification(env, `💰 New Order Received: ${orderId} - ₹${order?.total_amount}`);
            } else {
                await supabase
                    .from('orders')
                    .update({
                        payment_status: dbStatus,
                        // Don't change main status to failed immediately? maybe 'PAYMENT_FAILED'?
                        // But if it's failed, it's failed.
                        updated_at: new Date().toISOString()
                    })
                    .eq('external_order_id', orderId);
            }
        }

        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error('Cashfree Webhook Error:', error);
        return new Response('Error', { status: 500 });
    }
}

// Handler for Payment Webhook (Generic or custom one?)
export async function handlePaymentWebhook(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const signature = request.headers.get('x-webhook-signature');
        const rawBody = await request.text();

        // 1. Verify Signature if secret is provided
        if (env.GENERIC_WEBHOOK_SECRET) {
            const expectedSignature = await hmacSha256Base64(env.GENERIC_WEBHOOK_SECRET, rawBody);
            if (!signature || !timingSafeEqual(signature, expectedSignature)) {
                return new Response('Invalid Signature', { status: 401 });
            }
        }

        const payload = JSON.parse(rawBody);
        const { order_id, status } = payload;


        // Simple mapping
        if (order_id && status) {
            const supabase = createSupabaseAdmin(env);
            await supabase
                .from('orders')
                .update({
                    payment_status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('external_order_id', order_id);

            if (status === 'PAID' || status === 'SUCCESS') {
                await triggerShipping(env, order_id);
            }
        }

        return new Response('OK', { status: 200 });
    } catch (error) {
        return new Response('Error', { status: 500 });
    }
}

// Handler for Shiprocket Webhook
export async function handleShiprocketWebhook(request, env) {
    try {
        const signature = request.headers.get('x-api-key'); // Shiprocket uses x-api-key for webhook token
        const rawBody = await request.text();

        // 1. Verify Token
        if (env.SHIPROCKET_WEBHOOK_TOKEN) {
            if (!signature || !timingSafeEqual(signature, env.SHIPROCKET_WEBHOOK_TOKEN)) {
                console.error('Shiprocket Webhook: Invalid Token');
                return new Response('Invalid Token', { status: 401 });
            }
        } else {
             console.warn('SHIPROCKET_WEBHOOK_TOKEN not set, skipping verification');
        }

        const payload = JSON.parse(rawBody);
        console.log('Shiprocket Webhook:', payload);


        const { shipment_id, shipment_status, order_id, awb_code } = payload;
        // Shiprocket order_id might be ours or theirs.
        // Usually we map external_order_id to their order_id or they send order_id as our custom ID.

        // Update Order Status
        if (order_id) { // Assuming order_id is OUR external_order_id
            const supabase = createSupabaseAdmin(env);

            const updateData = { updated_at: new Date().toISOString() };
            if (shipment_status) updateData.status = shipment_status.toUpperCase(); // MAP?
            // Shiprocket statuses: AWBN ASSIGNED, PICKED UP, IN TRANSIT, DELIVERED, RTO INITIATED, RTO DELIVERED

            const statusMap = {
                'AWB ASSIGNED': 'PROCESSING',
                'PICKED UP': 'SHIPPED',
                'IN TRANSIT': 'SHIPPED',
                'DELIVERED': 'DELIVERED',
                'RTO INITIATED': 'RETURNED',
                'RTO DELIVERED': 'RETURNED',
                'CANCELED': 'CANCELLED'
            };

            const mappedStatus = statusMap[shipment_status] || shipment_status;
            updateData.status = mappedStatus;

            if (awb_code) updateData.awb_code = awb_code; // If we have this column

            await supabase.from('orders').update(updateData).eq('external_order_id', order_id);

            // Notify Customer on Status Change
            // ...
        }

        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error('Shiprocket Webhook Error:', error);
        return new Response('Error', { status: 500 });
    }
}
