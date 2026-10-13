import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';

export async function handleLeadAnalytics(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    // Check admin authentication for all methods
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

    if (request.method !== 'GET' && request.method !== 'POST') {
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
        const supabase = createSupabaseAdmin(env);

        // GET: Fetch analytics
        if (request.method === 'GET') {
            const { data, error } = await supabase
                .from('lead_analytics')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(5000);

            if (error) throw error;

            return new Response(JSON.stringify({ data: data || [] }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...getCORSHeaders(env, request),
                },
            });
        }

        // POST: Record event (if logic exists, otherwise just return empty?)
        // Original code had generic handler or maybe just fetched.
        // Looking at `index.js`, `handleLeadAnalytics` only fetched in lines 3043-3050.
        // But lines 3030 allow GET and POST.
        // If POST, it might be receiving data?
        // Actually, line 3046 does `select`.
        // It seems it ignored POST body and just returned data?
        // Let's assume it's for fetching only based on code I saw.
        // But I will keep it as is to avoid breaking anything that sends POST.

        const { data, error } = await supabase
            .from('lead_analytics')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(5000);

        if (error) throw error;

        return new Response(JSON.stringify({ data: data || [] }), {
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
