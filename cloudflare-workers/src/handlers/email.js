import { sendEmailViaApi } from '../utils/messaging';
import { getCORSHeaders } from '../utils/cors';

export async function handleSendEmail(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: getCORSHeaders(env, request) });
    }

    try {
        const { to, subject, html } = await request.json();
        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: getCORSHeaders(env, request) });
        }

        const result = await sendEmailViaApi(env, { to, subject, html });
        return new Response(JSON.stringify(result), { status: 200, headers: getCORSHeaders(env, request) });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: getCORSHeaders(env, request) });
    }
}
