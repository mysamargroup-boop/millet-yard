import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { hmacSha256Hex, timingSafeEqualHex } from '../utils/crypto';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from '../utils/messaging';

// Main Router for Auth
export async function handleAuthRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/auth/otp' || path === '/api/auth/resend') {
        return handleAuthRequestOTP(request, env);
    }
    if (path === '/api/auth/verify') {
        return handleAuthVerifyOTP(request, env);
    }

    // Default fallback (legacy path support if any)
    if (path === '/api/auth') {
        // Assume request OTP
        return handleAuthRequestOTP(request, env);
    }

    return new Response(JSON.stringify({ error: 'Auth route not found' }), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders(env, request),
        },
    });
}


// Route handler for requiring OTP (Stateless)
export async function handleAuthRequestOTP(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }

    try {

        const { phone } = await request.json();

        if (!phone) {
            return new Response(JSON.stringify({ error: 'Phone number is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        const supabase = createSupabaseAdmin(env);

        // 1. Check if login is enabled
        const { data: settings } = await supabase
            .from('site_settings')
            .select('customer_login_enabled, whatsapp_otp_template')
            .single();

        if (!settings?.customer_login_enabled) {
            return new Response(JSON.stringify({ error: 'Customer login is currently disabled' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        // 1.5 Rate Limiting
        // Fetch current limit status
        const { data: limitData } = await supabase
            .from('auth_rate_limits')
            .select('*')
            .eq('phone', phone)
            .maybeSingle(); // Changed single() to maybeSingle() to handle null

        const now = new Date();
        const BLOCK_DURATION_MINUTES = 15;
        const MAX_ATTEMPTS = 3;
        const WINDOW_MINUTES = 5;

        if (limitData) {
            // Check if blocked
            if (limitData.blocked_until && new Date(limitData.blocked_until) > now) {
                const blockedUntil = new Date(limitData.blocked_until);
                const minutesLeft = Math.ceil((blockedUntil - now) / 60000);
                return new Response(JSON.stringify({
                    error: `Too many attempts. Please try again in ${minutesLeft} minutes.`
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                });
            }

            // Check window reset
            const lastAttempt = new Date(limitData.last_attempt_at);
            const timeDiffMinutes = (now - lastAttempt) / 60000;

            if (timeDiffMinutes > WINDOW_MINUTES) {
                // Reset if outside window
                await supabase.from('auth_rate_limits').update({
                    count: 1,
                    last_attempt_at: now.toISOString(),
                    blocked_until: null
                }).eq('phone', phone);
            } else {
                // Within window, increment count
                const newCount = limitData.count + 1;

                if (newCount > MAX_ATTEMPTS) {
                    // Block user
                    const blockUntil = new Date(now.getTime() + BLOCK_DURATION_MINUTES * 60000);
                    await supabase.from('auth_rate_limits').update({
                        count: newCount,
                        last_attempt_at: now.toISOString(),
                        blocked_until: blockUntil.toISOString()
                    }).eq('phone', phone);

                    return new Response(JSON.stringify({
                        error: `Too many attempts. Blocked for ${BLOCK_DURATION_MINUTES} minutes.`
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                    });
                } else {
                    // Just increment
                    await supabase.from('auth_rate_limits').update({
                        count: newCount,
                        last_attempt_at: now.toISOString()
                    }).eq('phone', phone);
                }
            }
        } else {
            // First attempt, create record
            await supabase.from('auth_rate_limits').insert({
                phone,
                count: 1,
                last_attempt_at: now.toISOString()
            });
        }

        // 2. Generate OTP
        let otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Check for fixed OTP override (Admin/Test login)
        if (env.CONNECT_WHATSAPP && phone === env.CONNECT_WHATSAPP) {
            otp = env.TEST_OTP || '339633';
        }
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes (timestamp)

        // 3. Generate HMAC Hash (Stateless)
        // Hash = HMAC(phone + otp + expiresAt + SECRET)
        const secret = env.OTP_SECRET || 'default-secret-change-me';
        const message = `${phone}.${otp}.${expiresAt}`;
        const hash = await hmacSha256Hex(secret, message);

        // 4. Send WhatsApp
        const templateName = settings.whatsapp_otp_template;
        let whatsappSent = false;

        // TEST OVERRIDE: List of phone numbers that get OTP in response
        const TEST_NUMBERS = (env.TEST_PHONE_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean);

        if (env.CONNECT_WHATSAPP) {
            TEST_NUMBERS.push(env.CONNECT_WHATSAPP);
        }
        const isTestNumber = TEST_NUMBERS.length > 0 && TEST_NUMBERS.includes(phone);

        try {
            if (!isTestNumber) {
                if (!templateName) {
                    // Fallback to text message if no template configured
                    await sendWhatsAppTextMessage(env, {
                        to: phone,
                        body: `Your OTP is ${otp}. Valid for 5 minutes.`
                    });
                } else {
                    await sendWhatsAppTemplateMessage(env, {
                        to: phone,
                        templateName: templateName,
                        languageCode: 'en',
                        bodyParameters: [otp],
                        headerParameters: [],
                        // Special handling for otp_wb which requires button param
                        buttonParameters: templateName === 'otp_wb' ? [otp] : []
                    });
                }
                whatsappSent = true;
            } else {
                console.log('Skipping WhatsApp send for Test/Admin number');
                whatsappSent = true; // Pretend it was sent for success message
            }
        } catch (whatsappError) {
            console.error('WhatsApp Send Failed:', whatsappError);
            // If not a test number, we should probably let the user know, 
            // but for now we proceed silently or return error if critical.
        }

        // 5. Construct Response
        // Production Security: NEVER return OTP in response for real users.
        // Dev/Test: Return OTP if it's a test number or we are in dev.
        const responsePayload = {
            success: true,
            message: whatsappSent ? 'OTP sent via WhatsApp' : 'OTP generated (WhatsApp failed)',
            hash: `${hash}.${expiresAt}`,
            phone
        };

        // CONDITIONAL EXPOSURE
        if (isTestNumber) {
            responsePayload.otp = otp; // <--- Visible ONLY for Test Numbers
            responsePayload.message += ' (Test Mode: OTP included)';
        }

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });

    } catch (error) {
        console.error('OTP Request Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to send OTP' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }
}

// Route handler for verifying OTP (Stateless)
export async function handleAuthVerifyOTP(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }

    try {
        const { phone, otp, hash } = await request.json();
        if (!phone || !otp || !hash) {
            return new Response(JSON.stringify({ error: 'Phone, OTP, and Hash are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        // 1. Parse Hash: "signature.expiry"
        const [signature, expiresAtStr] = hash.split('.');
        if (!signature || !expiresAtStr) {
            return new Response(JSON.stringify({ error: 'Invalid hash format' }), { status: 400, headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) } });
        }

        const expiresAt = parseInt(expiresAtStr);

        // 2. Check Expiry
        if (Date.now() > expiresAt) {
            return new Response(JSON.stringify({ error: 'OTP has expired' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        // 3. Recompute Hash
        const secret = env.OTP_SECRET || 'default-secret-change-me';
        const message = `${phone}.${otp}.${expiresAt}`;
        const validSignature = await hmacSha256Hex(secret, message);

        // 4. Compare (Timing Safe)
        if (!timingSafeEqualHex(signature, validSignature)) {
            return new Response(JSON.stringify({ error: 'Invalid OTP' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        // 5. Success! Get or Create Customer
        // Refactored to avoid "no unique constraint matching ON CONFLICT" error
        const supabase = createSupabaseAdmin(env);

        let { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (fetchError) {
            console.error('Customer Fetch Error:', fetchError);
            throw fetchError;
        }

        if (customer) {
            // Customer exists, verify we have the ID and just update timestamp
            // Ideally we update last_login or updated_at
            const { error: updateError } = await supabase
                .from('customers')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', customer.id);

            if (updateError) console.warn('Failed to update timestamp:', updateError);
        } else {
            // Customer does not exist, try to create (Upsert to handle race conditions)
            // If it runs into a race condition (created between select and now), it will just update the timestamp/name
            const { data: upsertedCustomer, error: upsertError } = await supabase
                .from('customers')
                .upsert({
                    phone,
                    name: (env.CONNECT_WHATSAPP && phone === env.CONNECT_WHATSAPP) ? 'Samar Nema' : 'Customer',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'phone' })
                .select()
                .single();

            if (upsertError) {
                console.error('Customer Upsert Error:', upsertError);
                throw upsertError;
            }
            customer = upsertedCustomer;
        }

        return new Response(JSON.stringify({
            success: true,
            customer: customer
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });

    } catch (error) {
        console.error('OTP Verify Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Verification failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }
}
