import { getCORSHeaders } from '../utils/cors';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage, sendSlackNotification } from '../utils/messaging';

// Route handler for send-whatsapp
export async function handleSendWhatsApp(request, env) {
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
        const { to, body } = await request.json();

        if (!to || !body) {
            return new Response(
                JSON.stringify({ error: 'Missing to or body' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders(env, request),
                    },
                }
            );
        }

        const data = await sendWhatsAppTextMessage(env, { to, body });

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...getCORSHeaders(env, request),
            },
        });
    } catch (error) {
        console.error('WhatsApp Error:', error);
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

// Route handler for sending WhatsApp Templates (Generic)
export async function handleWhatsAppSendTemplate(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: getCORSHeaders(env, request) });
    }

    try {
        const body = await request.json();
        const { to, templateName, languageCode, headerParameters, bodyParameters, buttonParameters } = body;

        if (!to || !templateName) {
            return new Response(JSON.stringify({ error: 'Missing required fields: to, templateName' }), { status: 400, headers: getCORSHeaders(env, request) });
        }

        await sendWhatsAppTemplateMessage(env, {
            to,
            templateName,
            languageCode: languageCode || 'en',
            headerParameters: headerParameters || [],
            bodyParameters: bodyParameters || [],
            buttonParameters: buttonParameters || []
        });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: getCORSHeaders(env, request) });

    } catch (error) {
        console.error('WhatsApp Template Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: getCORSHeaders(env, request) });
    }
}
