
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createAdminToken, setAdminSessionCookie } from '@/lib/auth-middleware';
import { cookies } from 'next/headers';

// Helper to get IP or identifier
function getIdentifier(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || 'unknown';
    return `admin_login_${ip}`;
}

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MINUTES = 15;

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const identifier = getIdentifier(req);
        const supabase = supabaseAdmin();
        const now = new Date();

        // 1. Check Rate Limits using auth_rate_limits table
        const rateKey = `admin:${identifier}`;

        const { data: limitData } = await supabase
            .from('auth_rate_limits')
            .select('*')
            .eq('phone', rateKey)
            .maybeSingle();

        if (limitData) {
            if (limitData.blocked_until && new Date(limitData.blocked_until) > now) {
                const blockedUntil = new Date(limitData.blocked_until);
                const minutesLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / 60000);
                return NextResponse.json({ error: `Too many attempts. Please try again in ${minutesLeft} minutes.` }, { status: 429 });
            }

            // Reset if window passed (e.g. 15 mins)
            const lastAttempt = new Date(limitData.last_attempt_at);
            const timeDiff = (now.getTime() - lastAttempt.getTime()) / 60000;

            if (timeDiff > 15) {
                // Reset
                await supabase.from('auth_rate_limits').update({ count: 1, last_attempt_at: now.toISOString(), blocked_until: null }).eq('phone', rateKey);
            } else {
                // Increment
                const newCount = limitData.count + 1;
                if (newCount > MAX_ATTEMPTS) {
                    const blockUntil = new Date(now.getTime() + BLOCK_DURATION_MINUTES * 60000);
                    await supabase.from('auth_rate_limits').update({ count: newCount, last_attempt_at: now.toISOString(), blocked_until: blockUntil.toISOString() }).eq('phone', rateKey);
                    return NextResponse.json({ error: `Too many attempts. Blocked for ${BLOCK_DURATION_MINUTES} minutes.` }, { status: 429 });
                } else {
                    await supabase.from('auth_rate_limits').update({ count: newCount, last_attempt_at: now.toISOString() }).eq('phone', rateKey);
                }
            }
        } else {
            await supabase.from('auth_rate_limits').insert({ phone: rateKey, count: 1, last_attempt_at: now.toISOString() });
        }

        // 2. Verify Credentials - USE SERVER-ONLY ENV VARS (NO NEXT_PUBLIC_ PREFIX)
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('Admin credentials not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (email === adminEmail && password === adminPassword) {
            // Success - Clear rate limit
            await supabase.from('auth_rate_limits').delete().eq('phone', rateKey);

            // Create JWT token
            const token = createAdminToken(email);

            // Set HttpOnly cookie
            const cookieStore = await cookies();
            cookieStore.set('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            // Return success with token (for mobile app client-side state management)
            return NextResponse.json(
                { success: true, email, token },
                {
                    status: 200,
                    headers: {
                        'Set-Cookie': setAdminSessionCookie(token),
                    },
                }
            );
        } else {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

    } catch (error: any) {
        console.error('Admin Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
