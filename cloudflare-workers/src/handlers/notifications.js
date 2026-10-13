import { getCORSHeaders } from '../utils/cors';
import { checkAdminAuth } from '../utils/helpers';
import { createSupabaseAdmin } from '../utils/supabase';

/**
 * Handle sending push notifications via Expo Push API
 */
export async function handleAdminNotifications(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    // Check admin authentication
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
        const { to, title, body, data, sound, priority } = payload;

        if (!to) {
            return new Response(
                JSON.stringify({ error: 'Recipient token "to" is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                }
            );
        }

        // Prepare message for Expo
        const message = {
            to,
            title: title || 'Mobile Store Admin',
            body: body || 'New update from your store',
            data: data || {},
            sound: sound || 'default',
            priority: priority || 'high',
        };

        console.log('Sending push notification to Expo:', JSON.stringify(message));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });
    } catch (error) {
        console.error('Push Notification Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to send notification' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            }
        );
    }
}

/**
 * Register a device as an admin token
 */
export async function handleRegisterAdminToken(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    const auth = checkAdminAuth(request, env);
    if (!auth.valid) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: getCORSHeaders(env, request) });
    }

    try {
        const { token } = await request.json();
        if (!token) throw new Error('Token required');

        const supabase = createSupabaseAdmin(env);

        // Use site_settings to store admin tokens for simplicity
        const { data: settings } = await supabase.from('site_settings').select('admin_push_tokens').single();
        let tokens = settings?.admin_push_tokens || [];

        if (!tokens.includes(token)) {
            tokens.push(token);
            await supabase.from('site_settings').update({ admin_push_tokens: tokens }).eq('id', settings?.id || 1);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }
}

/**
 * System helper to notify all admins
 */
export async function notifyAdmins(env, title, body, data = {}) {
    try {
        const supabase = createSupabaseAdmin(env);
        const { data: settings } = await supabase.from('site_settings').select('admin_push_tokens').maybeSingle();
        const tokens = settings?.admin_push_tokens || [];

        if (tokens.length === 0) return;

        console.log(`Notifying ${tokens.length} admins: ${title}`);

        const messages = tokens.map(token => ({
            to: token,
            title,
            body,
            data,
            sound: 'default',
            priority: 'high',
        }));

        // Send to Expo in batches if needed, but here we just send
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });
    } catch (e) {
        console.error('Failed to notify admins:', e);
    }
}
