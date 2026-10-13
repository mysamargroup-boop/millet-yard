// WhatsApp template message sender
export async function sendWhatsAppTemplateMessage(env, input) {
    const accessToken =
        env.WHATSAPP_CLOUD_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId =
        env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = env.WHATSAPP_API_VERSION || 'v20.0';

    if (!accessToken || !phoneNumberId) {
        return;
    }

    const normalizedLanguage =
        input.languageCode === 'en' ? 'en_US' : input.languageCode;

    const components = [];

    if (input.headerParameters.length > 0) {
        components.push({
            type: 'header',
            parameters: input.headerParameters.map((text) => ({
                type: 'text',
                text,
            })),
        });
    }

    if (input.bodyParameters.length > 0) {
        components.push({
            type: 'body',
            parameters: input.bodyParameters.map((text) => ({
                type: 'text',
                text,
            })),
        });
    }

    if (input.buttonParameters && input.buttonParameters.length > 0) {
        input.buttonParameters.forEach((param, index) => {
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
                    language: { code: normalizedLanguage },
                    ...(components.length > 0 ? { components } : {}),
                },
            }),
        }
    );
}

export async function sendWhatsAppTextMessage(env, input) {
    const accessToken =
        env.WHATSAPP_CLOUD_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId =
        env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = env.WHATSAPP_API_VERSION || 'v20.0';

    if (!accessToken) {
        throw new Error(
            'WHATSAPP_CLOUD_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN is not set'
        );
    }
    if (!phoneNumberId) {
        throw new Error(
            'WHATSAPP_CLOUD_PHONE_NUMBER_ID or WHATSAPP_PHONE_NUMBER_ID is not set'
        );
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: input.to,
            type: 'text',
            text: {
                body: input.body,
                preview_url: Boolean(input.previewUrl),
            },
        }),
    });

    let data = null;
    try {
        data = await response.json();
    } catch (_e) {
        data = null;
    }

    if (!response.ok) {
        const message =
            (data &&
                (data.error?.message || data.error?.error_user_msg || data.message)) ||
            response.statusText ||
            'WhatsApp API request failed';
        throw new Error(`WhatsApp API error (${response.status}): ${message}`);
    }

    return data;
}

// Helper function to send Slack notification
export async function sendSlackNotification(env, message) {
    const slackWebhookUrl = env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl || !env.SLACK_ENABLED || env.SLACK_ENABLED !== 'true') {
        return;
    }

    try {
        const response = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: message,
            }),
        });

        if (!response.ok) {
            console.error(`Slack notification failed: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error sending Slack notification:', error);
    }
}

// Email Sender Helper (Generic HTTP API)
export async function sendEmailViaApi(env, { to, subject, html }) {
    // Example for Resend/Mailgun/SendGrid structure
    const apiKey = env.EMAIL_API_KEY;
    // const fromEmail = env.FROM_EMAIL || 'noreply@woody.co.in';

    // Placeholder: If using Resend
    // const url = 'https://api.resend.com/emails';
    // const body = { from: fromEmail, to, subject, html };

    // For now, we just log it as the user asked for "Setup structure"
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);

    if (!apiKey) {
        console.warn('Missing EMAIL_API_KEY. Email not sent.');
        return { success: false, error: 'Email configuration missing' };
    }

    // Real implementation would be:
    /*
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    return response.json();
    */

    return { success: true, mock: true };
}
