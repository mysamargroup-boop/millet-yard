import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET or ADMIN_JWT_SECRET environment variable is missing in production!');
}
const FALLBACK_SECRET = 'change-this-secret-for-dev-only-x9u2v8w6n4';
const FINAL_JWT_SECRET = JWT_SECRET || FALLBACK_SECRET;
// Use only server-side env var - NO NEXT_PUBLIC_ prefix to prevent exposure
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export interface AdminUser {
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Creates a signed token for admin user using HMAC
 */
export function createAdminToken(email: string): string {
  const payload = {
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
  };

  const payloadStr = JSON.stringify(payload);
  const signature = createHmac('sha256', FINAL_JWT_SECRET)
    .update(payloadStr)
    .digest('hex');

  // Simple format: payload.signature (base64 encoded)
  const encoded = Buffer.from(payloadStr).toString('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verifies and decodes admin token
 */
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) {
      return null;
    }

    const payloadStr = Buffer.from(encoded, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr) as AdminUser;

    // Verify signature
    const expectedSignature = createHmac('sha256', FINAL_JWT_SECRET)
      .update(payloadStr)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Gets admin session from cookie or Authorization header
 */
export async function getAdminSession(req: NextRequest): Promise<AdminUser | null> {
  // 1. Check Cookie (for Web Admin)
  const cookieStore = await cookies();
  let token = cookieStore.get('admin_token')?.value || req.cookies.get('admin_token')?.value;

  // 2. Check Authorization Header (for Mobile App)
  if (!token) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

/**
 * Middleware to require admin authentication
 * Returns the admin user or throws an error response
 */
export async function requireAdminAuth(req: NextRequest): Promise<{ user: AdminUser } | NextResponse> {
  const user = await getAdminSession(req);

  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin authentication required' },
      { status: 401 }
    );
  }

  // Verify email matches admin email
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid admin credentials' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Sets admin session cookie (HttpOnly, Secure)
 */
export function setAdminSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; ${isProduction ? 'Secure;' : ''}`;
}

/**
 * Clears admin session cookie
 */
export function clearAdminSessionCookie(): string {
  return 'admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;';
}
