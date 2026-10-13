import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        
        // Verify webhook signature for security
        const signature = request.headers.get('x-webhook-signature');
        const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            console.warn('CASHFREE_WEBHOOK_SECRET is not configured. Skipping signature verification.');
        } else if (signature) {
            const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
            if (!isValidSignature) {
                console.error('Invalid webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
            console.log('Webhook signature verified successfully');
        } else {
            console.warn('Missing x-webhook-signature header');
        }
        
        // Webhook body logged removed for security - only log order_id
        
        // Forward to Workers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'x-webhook-signature': signature || '',
        };
        
        if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
            headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
            headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
        }
        
        if (process.env.WORKER_API_KEY) {
            headers['X-API-Key'] = process.env.WORKER_API_KEY;
        }
        
        const response = await fetch(`${API.CASHFREE_WEBHOOK}`, {
            method: 'POST',
            headers,
            body: rawBody,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to process webhook');
        }

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error processing Cashfree webhook:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

        
