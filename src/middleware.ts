import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// ============================================================================
// 1. Edge-Safe In-Memory Sliding-Window Rate Limiter (Zero-Dependency)
// ============================================================================
const IN_MEMORY_WINDOW_MS = 60_000; // 1 minute window
const IN_MEMORY_MAX_REQUESTS = 60;  // 60 requests per minute per IP

const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

function checkInMemoryRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  // Opportunistic cleanup of expired entries
  if (ipRequestMap.size > 1000) {
    for (const [k, v] of ipRequestMap.entries()) {
      if (now > v.resetTime) ipRequestMap.delete(k);
    }
  }

  if (!record || now > record.resetTime) {
    ipRequestMap.set(ip, { count: 1, resetTime: now + IN_MEMORY_WINDOW_MS });
    return { allowed: true, remaining: IN_MEMORY_MAX_REQUESTS - 1, resetIn: IN_MEMORY_WINDOW_MS };
  }

  record.count++;
  const remaining = Math.max(0, IN_MEMORY_MAX_REQUESTS - record.count);
  const resetIn = Math.max(0, record.resetTime - now);

  return { allowed: record.count <= IN_MEMORY_MAX_REQUESTS, remaining, resetIn };
}

// ============================================================================
// 2. Bot Detection: Block Harmful Scrapers while Whitelisting Search & AI Engines
// ============================================================================
const BLOCKED_BOTS = [
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'blexbot',
  'petalbot', 'serpstatbot', 'megaindex', 'zoominfobot',
  'dataprovider', 'censysinspect', 'spyonweb', 'neevabot',
  'turnitin', 'screaming frog',
];

const ALLOWED_BOTS = [
  // Major Search Engines
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
  // Social Previews & Messengers
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot', 'pinterestbot',
  // AI Answer Engines & LLM Discovery (GEO)
  'gptbot', 'chatgpt-user', 'claudebot', 'perplexitybot', 'google-extended',
  'googleother', 'ccbot', 'applebot', 'applebot-extended', 'meta-externalagent',
  'bytespider', 'cohere-ai', 'isvisible',
];

function isBlockedBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  // Always permit allowed search & AI crawlers
  if (ALLOWED_BOTS.some(bot => ua.includes(bot))) return false;
  // Block identified bandwidth-draining scraping bots
  if (BLOCKED_BOTS.some(bot => ua.includes(bot))) return true;
  return false;
}

// ============================================================================
// 3. Pure Web-Crypto JWT Auth (Edge-Compatible, Zero Node Dependencies)
// ============================================================================
async function verifyWebCryptoJWT(token: string, secretStr: string): Promise<{ valid: boolean; payload?: any }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();

    // Import secret as HMAC SHA-256 key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretStr),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode base64url signature
    const sigStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const binarySig = atob(sigStr);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    // Verify signature over header.payload
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);

    if (!isValid) return { valid: false };

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiration if present
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

// ============================================================================
// Master Middleware Request Pipeline
// ============================================================================
export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // 1. Block Bad Bots Immediately
  if (isBlockedBot(userAgent)) {
    return new NextResponse('Access denied for automated scraper', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 2. Rate Limiting on API & Admin Login Endpoints
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminLogin = pathname === '/sr-admin/login';

  if (isApiRoute || isAdminLogin) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';

    const isLocalhost = (ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost')) && process.env.NODE_ENV === 'development';

    if (!isLocalhost) {
      // Pure in-memory sliding window rate check
      const inMem = checkInMemoryRateLimit(ip);
      const allowed = inMem.allowed;
      const limit = IN_MEMORY_MAX_REQUESTS;
      const remaining = inMem.remaining;
      const reset = Math.ceil(inMem.resetIn / 1000);

      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            },
          }
        );
      }
    }
  }

  // 3. Admin Route Security with Pure Web-Crypto JWT
  if (pathname.startsWith('/sr-admin')) {
    if (isAdminLogin) {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      const loginUrl = new URL('/sr-admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const secret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'millet_yard_admin_jwt_secret_2026';
    const { valid } = await verifyWebCryptoJWT(token, secret);

    if (!valid) {
      const loginUrl = new URL('/sr-admin/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('admin_token');
      return res;
    }

    return NextResponse.next();
  }

  // 4. Default: Attach SEO & Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
