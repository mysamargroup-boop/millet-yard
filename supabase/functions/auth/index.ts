
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Crypto Utils ---
async function hmacSha256Hex(secret: string, message: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        enc.encode(message)
    );
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function timingSafeEqualHex(a: string, b: string) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// --- WhatsApp Utils ---
async function sendWhatsAppTemplateMessage(env: any, input: any) {
    const accessToken = env.WHATSAPP_CLOUD_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = env.WHATSAPP_API_VERSION || 'v20.0';

    if (!accessToken || !phoneNumberId) return;

    const components = [];
    if (input.headerParameters?.length) {
        components.push({
            type: 'header',
            parameters: input.headerParameters.map((text: string) => ({ type: 'text', text })),
        });
    }
    if (input.bodyParameters?.length) {
        components.push({
            type: 'body',
            parameters: input.bodyParameters.map((text: string) => ({ type: 'text', text })),
        });
    }
    if (input.buttonParameters?.length) {
        input.buttonParameters.forEach((param: string, index: number) => {
            components.push({
                type: 'button',
                sub_type: 'url',
                index: index,
                parameters: [{ type: 'text', text: param }]
            });
        });
    }

    await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: input.to,
                type: 'template',
                template: {
                    name: input.templateName,
                    language: { code: input.languageCode === 'en' ? 'en_US' : input.languageCode },
                    ...(components.length > 0 ? { components } : {}),
                },
            }),
        }
    );
}

async function sendWhatsAppTextMessage(env: any, input: any) {
    const accessToken = env.WHATSAPP_CLOUD_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = env.WHATSAPP_API_VERSION || 'v20.0';

    if (!accessToken || !phoneNumberId) throw new Error('WhatsApp Token/ID missing');

    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: input.to,
            type: 'text',
            text: { body: input.body, preview_url: !!input.previewUrl },
        }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'WhatsApp API failed');
    }
}


// --- Main Handler ---
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { action, phone, otp, hash } = await req.json();
        const env = Deno.env.toObject();

        if (action === 'request_otp') {
            return await handleRequestOTP(phone, env);
        } else if (action === 'verify_otp') {
            return await handleVerifyOTP(phone, otp, hash, env);
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});


async function handleRequestOTP(phone: string, env: any) {
    if (!phone) throw new Error('Phone number is required');

    const supabase = createClient(
        env.SUPABASE_URL ?? '',
        env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Check settings
    const { data: settings } = await supabase.from('site_settings').select('customer_login_enabled, whatsapp_otp_template').maybeSingle();
    if (settings && !settings.customer_login_enabled) {
        throw new Error('Customer login is currently disabled');
    }

    // 2. Rate Limiting
    const now = new Date();
    const { data: limitData } = await supabase.from('auth_rate_limits').select('*').eq('phone', phone).maybeSingle();

    if (limitData) {
        if (limitData.blocked_until && new Date(limitData.blocked_until) > now) {
            throw new Error(`Too many attempts. Try again later.`);
        }
        const lastAttempt = new Date(limitData.last_attempt_at);
        if ((now.getTime() - lastAttempt.getTime()) > 5 * 60000) {
            // Reset
            await supabase.from('auth_rate_limits').update({ count: 1, last_attempt_at: now.toISOString(), blocked_until: null }).eq('phone', phone);
        } else {
            const newCount = limitData.count + 1;
            if (newCount > 3) {
                const blockUntil = new Date(now.getTime() + 15 * 60000);
                await supabase.from('auth_rate_limits').update({ count: newCount, last_attempt_at: now.toISOString(), blocked_until: blockUntil.toISOString() }).eq('phone', phone);
                throw new Error(`Too many attempts. Blocked for 15 minutes.`);
            }
            await supabase.from('auth_rate_limits').update({ count: newCount, last_attempt_at: now.toISOString() }).eq('phone', phone);
        }
    } else {
        await supabase.from('auth_rate_limits').insert({ phone, count: 1, last_attempt_at: now.toISOString() });
    }

    // 3. Generate OTP
    let generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    if (env.CONNECT_WHATSAPP && phone === env.CONNECT_WHATSAPP) generatedOtp = '339633';

    const expiresAt = Date.now() + 5 * 60 * 1000;
    const secret = env.OTP_SECRET || 'default-secret';
    const message = `${phone}.${generatedOtp}.${expiresAt}`;
    const hash = await hmacSha256Hex(secret, message);

    // 4. Send WhatsApp
    const templateName = settings?.whatsapp_otp_template;
    const isTestNumber = (env.CONNECT_WHATSAPP && phone === env.CONNECT_WHATSAPP);
    // Add other test numbers here if needed

    let whatsappSent = false;
    try {
        if (!isTestNumber) {
            if (templateName) {
                await sendWhatsAppTemplateMessage(env, {
                    to: phone,
                    templateName,
                    languageCode: 'en',
                    bodyParameters: [generatedOtp],
                    buttonParameters: templateName === 'otp_wb' ? [generatedOtp] : []
                });
            } else {
                await sendWhatsAppTextMessage(env, {
                    to: phone,
                    body: `Your OTP is ${generatedOtp}. Valid for 5 minutes.`
                });
            }
            whatsappSent = true;
        } else {
            whatsappSent = true; // Pretend sent
        }
    } catch (e) {
        console.error('WhatsApp failed', e);
    }

    const responsePayload: any = {
        success: true,
        message: whatsappSent ? 'OTP sent via WhatsApp' : 'OTP generated (WhatsApp failed)',
        hash: `${hash}.${expiresAt}`,
        phone
    };

    if (isTestNumber) {
        responsePayload.otp = generatedOtp;
        responsePayload.message += ' (Test Mode)';
    }

    return new Response(JSON.stringify(responsePayload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleVerifyOTP(phone: string, otp: string, hash: string, env: any) {
    if (!phone || !otp || !hash) throw new Error('Missing required fields');

    const [signature, expiresAtStr] = hash.split('.');
    if (!signature || !expiresAtStr) throw new Error('Invalid hash format');

    if (Date.now() > parseInt(expiresAtStr)) throw new Error('OTP has expired');

    const secret = env.OTP_SECRET || 'default-secret';
    const message = `${phone}.${otp}.${expiresAtStr}`;
    const validSignature = await hmacSha256Hex(secret, message);

    if (!timingSafeEqualHex(signature, validSignature)) throw new Error('Invalid OTP');

    // Success - Upsert customer
    const supabase = createClient(
        env.SUPABASE_URL ?? '',
        env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let { data: customer, error } = await supabase.from('customers').select('*').eq('phone', phone).maybeSingle();
    if (error) throw error;

    if (customer) {
        await supabase.from('customers').update({ updated_at: new Date().toISOString() }).eq('id', customer.id);
    } else {
        const { data: newCustomer, error: upsertError } = await supabase.from('customers').upsert({
            phone,
            name: (env.CONNECT_WHATSAPP && phone === env.CONNECT_WHATSAPP) ? 'Super Admin' : 'Customer',
            updated_at: new Date().toISOString()
        }, { onConflict: 'phone' }).select().single();
        if (upsertError) throw upsertError;
        customer = newCustomer;
    }

    return new Response(JSON.stringify({ success: true, customer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
