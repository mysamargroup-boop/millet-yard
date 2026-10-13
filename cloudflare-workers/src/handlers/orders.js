import { createSupabaseAdmin } from '../utils/supabase';
import { handleAdminNotifications, notifyAdmins } from './notifications';
import { validateOrderInput, checkRateLimit } from '../utils/helpers';

// Route handler for getting user orders
export async function handleOrders(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    try {
        const url = new URL(request.url);
        const phone = url.searchParams.get('phone');

        if (!phone) {
            return new Response(JSON.stringify({ error: 'Phone number required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        const supabase = createSupabaseAdmin(env);

        // SECURITY: Verify that the requester is the owner of the phone number
        // or has admin access.
        const { checkAdminAuth } = await import('../utils/helpers');
        const isAdmin = checkAdminAuth(request, env).valid;

        if (!isAdmin) {
            // Check if the request is from a logged-in user with the same phone
            // (If we have a JWT/Session system, verify it here)
            // For now, if no session, we can only trust 'phone' if we verify it via OTP first.
            // Since this is stateless, the frontend should send the OTP-verified hash.

            const hash = url.searchParams.get('hash');
            if (!hash) {
                return new Response(JSON.stringify({ error: 'Authorization required. Please log in again.' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }

            // Verify hash: Hash = HMAC(phone + SECRET)
            const { hmacSha256Hex, timingSafeEqualHex } = await import('../utils/crypto');
            const secret = env.OTP_SECRET || 'default-secret-change-me';
            const expectedHash = await hmacSha256Hex(secret, phone);

            if (!timingSafeEqualHex(hash, expectedHash)) {
                return new Response(JSON.stringify({ error: 'Invalid session. Please log in again.' }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                });
            }
        }

        const { data, error } = await supabase
            .from('orders')
            .select(isAdmin ? '*' : `
id,
    external_order_id,
    status,
    payment_status,
    total_amount,
    created_at,
    order_items(
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price,
        image_url
    )
        `)
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });
    }
}

// Route handler for create-order
export async function handleCreateOrder(request, env, ctx) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    try {
        // Rate limit (DoS protection)
        const rl = await checkRateLimit(request, env, {
            keyPrefix: 'orders:create',
            limit: 20,       // 20 requests
            windowSec: 600,  // per 10 minutes per IP
        });
        if (!rl.allowed) {
            return new Response(JSON.stringify({
                error: 'Too many order attempts. Please try again later.',
                retry_after_seconds: rl.resetTime,
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(rl.resetTime || 60),
                    ...getCORSHeaders(env, request),
                }
            });
        }

        const input = await request.json();

        // Support both frontend shapes: orderId/customerName (prepaid) and external_order_id/customer_name (COD)
        let orderId = input.orderId || input.external_order_id;

        // Admin Order Suffix: Add -SR if it's an admin-created order
        if (input.isAdmin && orderId && !orderId.endsWith('-SR')) {
            orderId = `${orderId} -SR`;
        }

        const customerName = input.customerName || input.customer_name;
        const customerPhone = input.customerPhone || input.customer_phone;
        let customerEmail = input.customerEmail || input.customer_email;
        const customerAddress = input.customerAddress || input.customer_address;
        const items = input.items || [];
        const couponCode = input.couponCode || input.coupon_code;
        const extraNote = input.extraNote || input.extra_note;
        const paymentMethod = (input.payment_method || input.paymentMethod || '').toUpperCase();
        const isCOD = paymentMethod === 'COD';
        const returnUrl = input.returnUrl || '';

        if (!orderId || !customerPhone || !items || items.length === 0) {
            throw new Error('orderId (or external_order_id), customerPhone (or customer_phone), and items are required');
        }

        const supabaseAdmin = createSupabaseAdmin(env);

        // Fetch site settings for email domain and other rules
        const { data: siteSettings } = await supabaseAdmin
            .from('site_settings')
            .select('cod_enabled, cod_extra_fee, cod_min_order_amount, contact_email')
            .maybeSingle();

        // Fix customer_email: If null, use customerPhone@domain
        if (!customerEmail) {
            const domain = siteSettings?.contact_email ? siteSettings.contact_email.split('@')[1] : 'woody.co.in';
            customerEmail = `${customerPhone} @${domain} `;
        }

        // IDEMPOTENCY CHECK: Check if order already exists
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id, status, payment_status, total_amount, external_order_id')
            .eq('external_order_id', String(orderId))
            .single();

        if (existingOrder) {
            const payload = {
                id: existingOrder.id,
                order_id: existingOrder.external_order_id,
                external_order_id: existingOrder.external_order_id,
                status: existingOrder.status,
                payment_status: existingOrder.payment_status,
                total_amount: existingOrder.total_amount,
                existing: true,
            };
            if (!isCOD) payload.payment_session_id = null;
            return new Response(JSON.stringify(payload), {
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                status: 200,
            });
        }

        // SECURITY: Calculate total amount from database instead of trusting client
        let calculatedTotalAmount = 0;
        let validatedItems = [];

        if (items && items.length > 0) {
            const productIds = items.map((item) => item.id).filter(Boolean);

            if (productIds.length > 0) {
                const { data: products, error: productError } = await supabaseAdmin
                    .from('products')
                    .select('id, sale_price, regular_price, name')
                    .in('id', productIds);

                if (productError) {
                    throw new Error('Failed to fetch product prices');
                }

                const productMap = new Map(
                    products?.map((product) => [product.id, product]) || []
                );

                validatedItems = items.map((item) => {
                    const product = productMap.get(item.id);
                    if (!product) {
                        throw new Error(`Product with ID ${item.id} not found`);
                    }

                    // Use sale_price if available, otherwise regular_price
                    const price = product.sale_price || product.regular_price || 0;
                    const quantity = Number(item.quantity) || 1;
                    const unitPrice = Number(price);
                    const totalPrice = unitPrice * quantity;

                    calculatedTotalAmount += totalPrice;

                    return {
                        product_id: item.id,
                        product_name: product.name,
                        sku: item.id,
                        quantity,
                        unit_price: unitPrice,
                        total_price: totalPrice,
                        image_url: item.imageUrl, // Optional: still trust client for image URL as it's display only, or fetch?
                        image_hint: item.imageHint,
                    };
                });
            }
        }

        // Ensure we have a valid amount
        if (calculatedTotalAmount <= 0) {
            if (!items || items.length === 0) throw new Error("No items in order");
        }

        // SECURITY: Server-side coupon validation and discount calculation
        let couponDiscount = 0;
        let validatedCouponCode = null;

        if (couponCode) {
            const code = String(couponCode).trim().toUpperCase();
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', code)
                .eq('active', true)
                .maybeSingle();

            if (!couponError && coupon) {
                validatedCouponCode = coupon.code;
                if (coupon.type === 'percent') {
                    couponDiscount = (calculatedTotalAmount * (Number(coupon.value) / 100));
                } else if (coupon.type === 'flat') {
                    couponDiscount = Number(coupon.value);
                }
                // Cap discount at total
                couponDiscount = Math.min(calculatedTotalAmount, couponDiscount);
            }
        }

        let amountAfterDiscount = Math.max(0, calculatedTotalAmount - couponDiscount);
        let codFee = 0;

        // COD: apply COD rules using siteSettings fetched earlier
        if (isCOD) {
            if (!siteSettings?.cod_enabled) {
                throw new Error('Cash on Delivery is currently disabled.');
            }
            if (siteSettings.cod_min_order_amount != null && amountAfterDiscount < Number(siteSettings.cod_min_order_amount)) {
                throw new Error(`Minimum order amount for COD is ₹${siteSettings.cod_min_order_amount} `);
            }
            codFee = Number(siteSettings?.cod_extra_fee || 0);
            amountAfterDiscount = Math.max(0, amountAfterDiscount) + codFee;
        } else {
            amountAfterDiscount = Math.max(1, amountAfterDiscount);
        }

        // Fix payment_status logic: 
        // 1. COD is always PENDING initially.
        // 2. Prepaid from Admin can be PAID if they want to mark it so.
        // 3. Prepaid from frontend is PENDING until gateway confirms.
        let initialPaymentStatus = 'PENDING';
        if (!isCOD && input.isAdmin && input.payment_status) {
            initialPaymentStatus = input.payment_status.toUpperCase();
        }

        // 1. Save Order to Supabase in 'PENDING' state
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                external_order_id: String(orderId),
                customer_name: customerName || 'Customer',
                customer_phone: String(customerPhone),
                customer_email: customerEmail,
                status: 'PENDING',
                payment_status: initialPaymentStatus,
                payment_method: isCOD ? 'COD' : 'PREPAID',
                subtotal_amount: calculatedTotalAmount,
                total_amount: amountAfterDiscount,
                customer_address: customerAddress || 'Address not provided'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create order items using validated data
        if (validatedItems.length > 0) {
            const orderItems = validatedItems.map((item) => ({
                order_id: orderData.id,
                ...item,
            }));
            const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;
        }

        // 2b. Record coupon redemption
        if (validatedCouponCode && couponDiscount > 0) {
            await supabaseAdmin.from('coupon_redemptions').insert({
                order_id: orderData.id,
                coupon_code: validatedCouponCode,
                discount_amount: couponDiscount
            });
        }

        // Trigger admin notification
        ctx.waitUntil(notifyAdmins(env, isCOD ? 'New COD Order! 📦' : 'New Order Attempt! 🛍️',
            `Order #${orderId} for ₹${amountAfterDiscount} from ${customerName}`,
            { orderId, type: 'NEW_ORDER' }
        ));

        // COD: return order immediately (no payment gateway)
        if (isCOD) {
            return new Response(JSON.stringify({
                id: orderData.id,
                external_order_id: orderData.external_order_id,
                order_id: orderData.external_order_id,
                status: orderData.status,
                payment_status: orderData.payment_status,
                total_amount: orderData.total_amount,
            }), {
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                status: 200,
            });
        }

        // 3. Create Cashfree order with discounted amount (prepaid only)
        const requestBody = {
            order_id: orderId,
            order_amount: amountAfterDiscount,
            order_currency: 'INR',
            customer_details: {
                customer_id: String(customerPhone).replace(/[^a-zA-Z0-9_-]/g, ''),
                customer_name: customerName,
                customer_email: customerEmail || `customer - ${Date.now()} @example.com`,
                customer_phone: String(customerPhone),
            },
            order_meta: {
                return_url: `${returnUrl}?order_id = ${orderId} `,
                notify_url: `${new URL(request.url).origin}/cashfree-webhook`,
            },
            order_note: extraNote || '',
        };

        const cashfreeResponse = await fetch(`${cashfreeConfig.baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': cashfreeConfig.appId,
                'x-client-secret': cashfreeConfig.secretKey,
            },
            body: JSON.stringify(requestBody),
        });

        const cashfreeData = await cashfreeResponse.json();

        if (!cashfreeResponse.ok) {
            throw new Error(cashfreeData.message || 'Cashfree order creation failed');
        }

        return new Response(JSON.stringify({
            order_id: cashfreeData.order_id,
            payment_session_id: cashfreeData.payment_session_id,
            env: envType,
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
            status: 200,
        });

    } catch (error) {
        console.error('Create Order Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
            status: 500,
        });
    }
}

// Route handler for create-payment
export async function handleCreatePayment(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    try {
        const { orderId, amount, customerName, customerPhone, customerEmail, returnUrl, items, couponCode } = await request.json();

        const envType = env.CASHFREE_ENV?.trim().toUpperCase() || 'SANDBOX';
        const cashfreeConfig = {
            env: envType,
            baseUrl: envType === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg',
            appId: env.CASHFREE_APP_ID?.trim(),
            secretKey: env.CASHFREE_SECRET_KEY?.trim(),
        };

        if (!cashfreeConfig.appId || !cashfreeConfig.secretKey) {
            throw new Error('Cashfree credentials missing in environment variables.');
        }
        if (!orderId || !amount || !customerPhone) {
            throw new Error('Missing required fields: orderId, amount, and customerPhone are required.');
        }

        const supabaseAdmin = createSupabaseAdmin(env);

        // IDEMPOTENCY CHECK: Check if order already exists
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id, status, payment_status, total_amount')
            .eq('external_order_id', String(orderId))
            .single();

        if (existingOrder) {
            return new Response(JSON.stringify({
                order_id: existingOrder.external_order_id,
                payment_session_id: null,
                env: envType,
                existing: true,
                status: existingOrder.status,
                payment_status: existingOrder.payment_status,
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
                status: 200,
            });
        }

        // SECURITY: Calculate total amount from database instead of trusting client
        let calculatedTotalAmount = 0;
        let validatedItems = [];

        if (items && items.length > 0) {
            const productIds = items.map((item) => item.id).filter(Boolean);

            if (productIds.length > 0) {
                const { data: products, error: productError } = await supabaseAdmin
                    .from('products')
                    .select('id, sale_price, regular_price, name')
                    .in('id', productIds);

                if (productError) {
                    throw new Error('Failed to fetch product prices');
                }

                const productMap = new Map(
                    products?.map((product) => [product.id, product]) || []
                );

                validatedItems = items.map((item) => {
                    const product = productMap.get(item.id);
                    if (!product) {
                        throw new Error(`Product with ID ${item.id} not found`);
                    }

                    const quantity = Number(item.quantity) || 1;
                    const unitPrice = Number(product.sale_price || product.regular_price || 0);
                    const totalPrice = unitPrice * quantity;

                    calculatedTotalAmount += totalPrice;

                    return {
                        product_id: item.id,
                        product_name: product.name,
                        sku: item.id,
                        quantity,
                        unit_price: unitPrice,
                        total_price: totalPrice,
                        image_url: item.imageUrl,
                        image_hint: item.imageHint,
                    };
                });
            }
        }

        const finalAmount = calculatedTotalAmount > 0 ? calculatedTotalAmount : Number(amount);
        if (finalAmount <= 0) {
            throw new Error('Invalid order amount');
        }

        // SECURITY: Server-side coupon validation and discount calculation
        let couponDiscount = 0;
        let validatedCouponCode = null;

        if (couponCode) {
            const code = String(couponCode).trim().toUpperCase();
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', code)
                .eq('active', true)
                .maybeSingle();

            if (!couponError && coupon) {
                validatedCouponCode = coupon.code;
                if (coupon.type === 'percent') {
                    couponDiscount = Math.min(finalAmount, finalAmount * (Number(coupon.value) / 100));
                } else if (coupon.type === 'flat') {
                    couponDiscount = Math.min(finalAmount, Number(coupon.value));
                }
            }
        }

        const amountAfterDiscount = Math.max(1, finalAmount - couponDiscount);

        // 1. Save Order to Supabase in 'PENDING' state
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                external_order_id: String(orderId),
                customer_name: customerName || 'Customer',
                customer_phone: String(customerPhone),
                customer_email: customerEmail || null,
                status: 'PENDING',
                payment_status: 'PENDING',
                payment_method: 'PREPAID',
                subtotal_amount: finalAmount,
                total_amount: amountAfterDiscount,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create order items using validated data
        if (validatedItems.length > 0) {
            const orderItems = validatedItems.map((item) => ({
                order_id: orderData.id,
                ...item,
            }));
            const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;
        }

        // 3. Create Cashfree Order with discounted amount
        const requestBody = {
            order_id: String(orderId),
            order_amount: amountAfterDiscount,
            order_currency: 'INR',
            customer_details: {
                customer_id: String(customerPhone).replace(/[^a-zA-Z0-9_-]/g, ''),
                customer_phone: String(customerPhone),
                customer_name: customerName || 'Customer',
                customer_email: customerEmail || `customer-${Date.now()}@example.com`,
            },
            order_meta: {
                return_url: `${returnUrl}?order_id={order_id}`,
            },
        };

        const cashfreeResponse = await fetch(`${cashfreeConfig.baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': cashfreeConfig.appId,
                'x-client-secret': cashfreeConfig.secretKey,
            },
            body: JSON.stringify(requestBody),
        });

        const cashfreeData = await cashfreeResponse.json();

        if (!cashfreeResponse.ok) {
            throw new Error(cashfreeData.message || 'Cashfree order creation failed');
        }

        // 4. Track coupon usage if coupon was applied and valid
        if (validatedCouponCode && couponDiscount > 0) {
            try {
                await supabaseAdmin
                    .from('coupon_redemptions')
                    .insert({
                        order_id: orderData.id,
                        coupon_code: validatedCouponCode,
                        discount_amount: couponDiscount,
                    });
            } catch (couponError) {
                console.error('Failed to track coupon redemption:', couponError);
            }
        }

        return new Response(JSON.stringify({
            order_id: cashfreeData.order_id,
            payment_session_id: cashfreeData.payment_session_id,
            env: envType,
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
            status: 500,
        });
    }
}

// Route handler for orders-admin
export async function handleOrdersAdmin(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    // Check admin authentication
    const { checkAdminAuth } = await import('../utils/helpers');
    const auth = checkAdminAuth(request, env);
    if (!auth.valid) {
        return new Response(
            JSON.stringify({ error: auth.error || 'Unauthorized - Admin API key required' }),
            {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }

    try {
        const payload = await request.json();
        const supabase = createSupabaseAdmin(env);

        if (payload.action === 'list') {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (payload.action === 'getById') {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.orderId)
                .maybeSingle();

            if (error) throw error;

            return new Response(JSON.stringify(data || null), {
                status: data ? 200 : 404,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (payload.action === 'getByExternalId') {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('external_order_id', payload.externalOrderId)
                .maybeSingle();

            if (error) {
                if (error.code === 'PGRST116') {
                    return new Response(
                        JSON.stringify({ error: 'Order not found' }),
                        {
                            status: 404,
                            headers: {
                                'Content-Type': 'application/json',
                                ...getCORSHeaders(env, request),
                            },
                        },
                    );
                }
                throw error;
            }

            return new Response(JSON.stringify(data || null), {
                status: data ? 200 : 404,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (payload.action === 'history') {
            const { data, error } = await supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', payload.orderId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify(data || []), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        if (payload.action === 'updateStatus') {
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', payload.orderId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!order) {
                return new Response(
                    JSON.stringify({ error: 'Order not found' }),
                    {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getCORSHeaders(env, request),
                        },
                    },
                );
            }

            const { data: updatedOrder, error } = await supabase
                .from('orders')
                .update({
                    status: payload.status,
                    admin_notes: payload.adminNote ?? order.admin_notes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.orderId)
                .select()
                .maybeSingle();

            if (error) throw error;

            await supabase.from('order_status_history').insert({
                order_id: payload.orderId,
                old_status: order.status,
                new_status: payload.status,
                reason: payload.reason ?? null,
                admin_note: payload.adminNote ?? null,
                created_by: 'admin',
                created_at: new Date().toISOString(),
            });

            return new Response(
                JSON.stringify({ success: true, order: updatedOrder }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                },
            );
        }

        if (payload.action === 'cancel') {
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', payload.orderId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!order) {
                return new Response(
                    JSON.stringify({ error: 'Order not found' }),
                    {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getCORSHeaders(env, request),
                        },
                    },
                );
            }

            const { data: updatedOrder, error } = await supabase
                .from('orders')
                .update({
                    status: 'CANCELLED',
                    admin_notes: payload.adminNote ?? null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.orderId)
                .select()
                .maybeSingle();

            if (error) throw error;

            await supabase.from('order_status_history').insert({
                order_id: payload.orderId,
                old_status: order.status,
                new_status: 'CANCELLED',
                reason: payload.cancelReason ?? null,
                admin_note: payload.adminNote ?? null,
                created_by: 'admin',
                created_at: new Date().toISOString(),
            });

            return new Response(
                JSON.stringify({ success: true, order: updatedOrder }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                },
            );
        }

        if (payload.action === 'return') {
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', payload.orderId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!order) {
                return new Response(
                    JSON.stringify({ error: 'Order not found' }),
                    {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getCORSHeaders(env, request),
                        },
                    },
                );
            }

            const { data: updatedOrder, error } = await supabase
                .from('orders')
                .update({
                    status: 'RETURNED',
                    return_reason: payload.returnReason ?? null,
                    admin_notes: payload.adminNote ?? null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.orderId)
                .select()
                .maybeSingle();

            if (error) throw error;

            await supabase.from('order_status_history').insert({
                order_id: payload.orderId,
                old_status: order.status,
                new_status: 'RETURNED',
                reason: payload.returnReason ?? null,
                admin_note: payload.adminNote ?? null,
                created_by: 'admin',
                created_at: new Date().toISOString(),
            });

            return new Response(
                JSON.stringify({ success: true, order: updatedOrder }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                },
            );
        }

        if (payload.action === 'refund') {
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', payload.orderId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!order) {
                return new Response(
                    JSON.stringify({ error: 'Order not found' }),
                    {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            ...getCORSHeaders(env, request),
                        },
                    },
                );
            }

            const { data: updatedOrder, error } = await supabase
                .from('orders')
                .update({
                    status: 'REFUNDED',
                    refund_amount: payload.refundAmount,
                    refund_reason: payload.refundReason ?? null,
                    admin_notes: payload.adminNote ?? null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.orderId)
                .select()
                .maybeSingle();

            if (error) throw error;

            await supabase.from('order_status_history').insert({
                order_id: payload.orderId,
                old_status: order.status,
                new_status: 'REFUNDED',
                reason: payload.refundReason ?? null,
                admin_note: payload.adminNote ?? null,
                created_by: 'admin',
                created_at: new Date().toISOString(),
            });

            return new Response(
                JSON.stringify({ success: true, order: updatedOrder }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                },
            );
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            },
        );
    } catch (error) {
        const message =
            error && typeof error === 'object' && 'message' in error
                ? String(error.message)
                : 'Unexpected error';

        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });
    }
}
