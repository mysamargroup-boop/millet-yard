import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';

/**
 * Simple database-backed rate limiter for Next.js API routes.
 * Reuses the 'auth_rate_limits' table.
 */
export async function checkRateLimit(
    req: NextRequest,
    options: {
        keyPrefix: string;
        limit: number;
        windowMinutes: number;
        identifier?: string;
    }
) {
    const { keyPrefix, limit, windowMinutes } = options;
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const identifier = options.identifier || ip;
    const rateKey = `${keyPrefix}:${identifier}`;
    const now = new Date();

    const supabase = supabaseAdmin();

    // 1. Get current rate limit data
    const { data: limitData } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('phone', rateKey)
        .maybeSingle();

    if (limitData) {
        // Check if blocked
        if (limitData.blocked_until && new Date(limitData.blocked_until) > now) {
            const blockedUntil = new Date(limitData.blocked_until);
            const secondsLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
            return {
                allowed: false,
                response: NextResponse.json(
                    { error: `Too many requests. Please try again in ${secondsLeft} seconds.` },
                    {
                        status: 429,
                        headers: { 'Retry-After': secondsLeft.toString() }
                    }
                )
            };
        }

        // Reset window if expired
        const lastAttempt = new Date(limitData.last_attempt_at);
        const minutesDiff = (now.getTime() - lastAttempt.getTime()) / 60000;

        if (minutesDiff > windowMinutes) {
            // Reset count
            await supabase
                .from('auth_rate_limits')
                .update({ count: 1, last_attempt_at: now.toISOString(), blocked_until: null })
                .eq('phone', rateKey);
            return { allowed: true };
        } else {
            // Increment count
            const newCount = limitData.count + 1;
            if (newCount > limit) {
                const blockUntil = new Date(now.getTime() + windowMinutes * 60000);
                await supabase
                    .from('auth_rate_limits')
                    .update({
                        count: newCount,
                        last_attempt_at: now.toISOString(),
                        blocked_until: blockUntil.toISOString()
                    })
                    .eq('phone', rateKey);

                return {
                    allowed: false,
                    response: NextResponse.json(
                        { error: `Rate limit exceeded. Blocked for ${windowMinutes} minutes.` },
                        {
                            status: 429,
                            headers: { 'Retry-After': (windowMinutes * 60).toString() }
                        }
                    )
                };
            } else {
                await supabase
                    .from('auth_rate_limits')
                    .update({ count: newCount, last_attempt_at: now.toISOString() })
                    .eq('phone', rateKey);
                return { allowed: true };
            }
        }
    } else {
        // First attempt
        await supabase
            .from('auth_rate_limits')
            .insert({ phone: rateKey, count: 1, last_attempt_at: now.toISOString() });
        return { allowed: true };
    }
}
