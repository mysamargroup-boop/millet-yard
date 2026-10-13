import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';

export async function handleSubscriptions(request, env) {
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
        const { email } = await request.json();
        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: 'Invalid email' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        const supabase = createSupabaseAdmin(env);

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({ email, status: 'subscribed' })
            .select()
            .maybeSingle();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return new Response(JSON.stringify({ message: 'Already subscribed' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
                });
            }
            throw error;
        }

        return new Response(JSON.stringify({ success: true, data }), {
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
