export function getCORSHeaders(env, request) {
    const allowedOrigin = env?.ALLOWED_ORIGIN || env?.PUBLIC_URL || 'http://localhost:3000';
    const requestOrigin = request?.headers?.get('Origin') || '*';

    // Handle multiple origins
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://business.woody.co.in',
        'https://shop-cloud.pages.dev',
        ...(allowedOrigin ? allowedOrigin.split(',') : [])
    ].map(o => o.trim());

    let origin = 'http://localhost:3000'; // Default safe origin

    // In local development (even if ENVIRONMENT=production is set in wrangler.toml)
    // We want to be permissive with localhost
    if (env?.ENVIRONMENT !== 'production' || requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')) {
        origin = requestOrigin || '*';
    } else if (allowedOrigins.includes(requestOrigin)) {
        origin = requestOrigin;
    }

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-API-Key, x-client-info, CF-Access-Client-Id, CF-Access-Client-Secret, x-forwarded-host, origin, referer',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}
