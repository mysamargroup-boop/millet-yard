
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmailViaApi(env: any, { to, subject, html }: any) {
    const apiKey = env.EMAIL_API_KEY;

    // Placeholder logging acting as a mock
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);

    if (!apiKey) {
        console.warn('Missing EMAIL_API_KEY. Email not sent.');
        return { success: false, error: 'Email configuration missing' };
    }

    // Real implementation (e.g., Resend) would be:
    /*
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to,
            subject,
            html
        })
    });
    return await res.json();
    */

    return { success: true, mock: true };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const env = Deno.env.toObject();
        const result = await sendEmailViaApi(env, { to, subject, html });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
