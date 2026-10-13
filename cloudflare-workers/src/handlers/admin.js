import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';

/**
 * Handle Admin Login for the Mobile App
 * Verifies email/password against environment variables or a dedicated table.
 */
export async function handleAdminLogin(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        // Check against environment variables (should be set as Secrets in Cloudflare)
        const adminEmail = env.ADMIN_EMAIL;
        const adminPassword = env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return new Response(JSON.stringify({ error: 'Server configuration error: Admin credentials missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

        if (email === adminEmail && password === adminPassword) {
            // Success!
            // Note: Cloudflare Workers are stateless. We return a survival token or the API Key.
            // For simplicity and matching current mobile logic, we return a success response.
            return new Response(JSON.stringify({
                success: true,
                token: env.API_KEY || 'hc_dummy_token', // Reusing the Worker's API Key as the session token
                email: email
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
            });
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to process login' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }
}
