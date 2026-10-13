import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-middleware';

/**
 * Endpoint to verify admin session
 * Used by client to check if user is still authenticated
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAdminSession(req);

    if (!user || !user.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
