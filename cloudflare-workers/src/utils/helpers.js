// Helper function to trigger shipping order creation
export async function createShippingOrder(env, orderId) {
    const baseUrl = env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_BASE_URL || 'https://business.woody.co.in';
    const shippingApiUrl = `${baseUrl}/api/shiprocket/order`;

    if (!orderId) return;

    try {
        console.log(`Triggering shipping order for ${orderId} to ${shippingApiUrl}`);
        // Fire and forget, but we await fetch start at least
        const response = await fetch(shippingApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Shipping order creation failed: ${response.status} ${text}`);
        } else {
            // const data = await response.json();
            console.log('Shipping order creation triggered');
        }
    } catch (error) {
        console.error('Error creating shipping order:', error);
    }
}

// Alias for compatibility
export function triggerShipping(env, orderId) {
    return createShippingOrder(env, orderId);
}

function getClientIp(request) {
    return (
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')?.[0]?.trim() ||
        request.headers.get('X-Real-IP') ||
        'unknown'
    );
}

/**
 * Rate limiting using Cloudflare KV (preferred) with in-memory fallback (best-effort).
 *
 * NOTE:
 * - For production DoS protection, bind a KV namespace as `KV` in Worker settings.
 * - Fallback is only for local/dev or when KV is not configured.
 */
export async function checkRateLimit(request, env, opts = {}) {
    const {
        keyPrefix = 'ratelimit',
        limit = 100,
        windowSec = 3600,
    } = opts || {};

    const ip = getClientIp(request);
    const windowKey = Math.floor(Date.now() / (windowSec * 1000));
    const key = `${keyPrefix}:${ip}:${windowKey}`;

    // Preferred: KV-based
    if (env?.KV) {
        const raw = await env.KV.get(key);
        const count = raw ? parseInt(raw, 10) : 0;

        if (Number.isFinite(count) && count >= limit) {
            const now = Math.floor(Date.now() / 1000);
            const resetAt = (windowKey + 1) * windowSec;
            return { allowed: false, remaining: 0, resetTime: Math.max(0, resetAt - now) };
        }

        const next = count + 1;
        await env.KV.put(key, String(next), { expirationTtl: windowSec });
        return { allowed: true, remaining: Math.max(0, limit - next) };
    }

    // Fallback: in-memory per isolate (best-effort)
    const g = globalThis;
    if (!g.__rateLimitStore) g.__rateLimitStore = new Map();
    const store = g.__rateLimitStore;

    const nowMs = Date.now();
    const entry = store.get(key) || { count: 0, expiresAt: nowMs + windowSec * 1000 };
    if (nowMs > entry.expiresAt) {
        entry.count = 0;
        entry.expiresAt = nowMs + windowSec * 1000;
    }

    if (entry.count >= limit) {
        const resetTime = Math.ceil((entry.expiresAt - nowMs) / 1000);
        store.set(key, entry);
        return { allowed: false, remaining: 0, resetTime };
    }

    entry.count += 1;
    store.set(key, entry);
    return { allowed: true, remaining: Math.max(0, limit - entry.count), resetTime: Math.ceil((entry.expiresAt - nowMs) / 1000) };
}

// Input validation helper
export function validateOrderInput(data) {
    const errors = [];

    if (!data.orderId) errors.push('orderId is required');
    if (!data.amount || data.amount <= 0) errors.push('Invalid amount');
    if (!data.customerPhone) errors.push('customerPhone is required');
    if (!data.items || data.items.length === 0) errors.push('items are required');

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}

// Error logging helper
export function logError(context, error, request) {
    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        context,
        error: error.message,
        stack: error.stack,
        request: {
            method: request.method,
            url: request.url,
            ip: request.headers.get('CF-Connecting-IP'),
            userAgent: request.headers.get('User-Agent')
        }
    }));
}

// Simple auth check - only for admin endpoints
export function checkAdminAuth(request, env) {
    const apiKey = request.headers.get('X-API-Key');
    const validApiKey = env?.API_KEY || env?.API_LOG_KEY;

    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
        return { valid: false, error: 'Admin API key required' };
    }

    return { valid: true };
}

// Helper function for order status messages
export function getOrderStatusMessage(status) {
    const messages = {
        'PENDING': 'Payment pending. Please complete your payment.',
        'ACTIVE': 'Payment pending. Please complete your payment.',
        'PAID': 'Payment successful! Your order has been confirmed.',
        'CONFIRMED': 'Payment successful! Your order has been confirmed.',
        'PROCESSING': 'Your order is being processed.',
        'SHIPPED': 'Your order has been shipped!',
        'DELIVERED': 'Your order has been delivered.',
        'CANCELLED': 'This order has been cancelled.',
        'RETURNED': 'Return has been processed.',
        'REFUNDED': 'Refund has been processed.',
    };
    return messages[status] || 'Order status: ' + (status || 'Unknown');
}
