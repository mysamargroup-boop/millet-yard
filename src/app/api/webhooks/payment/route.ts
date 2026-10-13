import { NextResponse } from 'next/server';

// Handle POST webhooks from Cashfree
export async function POST(request: Request) {
    try {
        // We need to forward the raw body or json, and headers (signature)
        // Cashfree sends payload as form-url-encoded or json? Typically JSON for webhooks.
        // We should forward headers like x-webhook-signature if present.

        const body = await request.json();
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';
        const endpoint = `${workerUrl}/webhooks/payment`; // Assuming existing handlePaymentWebhook

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers // Forward signature headers
            },
            body: JSON.stringify(body),
        });

        // Webhooks usually just expect 200 OK
        if (!res.ok) {
            console.error('Worker Webhook Failed', res.status);
        }

        return NextResponse.json({ status: 'received' }, { status: 200 }); // Always acknowledge to Cashfree
    } catch (error) {
        console.error('Webhook Proxy Error', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
