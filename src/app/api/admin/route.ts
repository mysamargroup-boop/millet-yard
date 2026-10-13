import { NextRequest, NextResponse } from 'next/server';
import { validateCloudflareAccess, isAdminPath } from '@/lib/cloudflare-access';

export async function GET(req: NextRequest) {
  // Check admin access for protected routes
  if (isAdminPath(req.nextUrl.pathname)) {
    const access = await validateCloudflareAccess(req);
    if (!access.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Admin dashboard logic here
    return NextResponse.json({ 
      message: 'Admin access granted',
      user: access.email,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Check admin access for protected routes
  if (isAdminPath(req.nextUrl.pathname)) {
    const access = await validateCloudflareAccess(req);
    if (!access.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Admin action logic here
    const action = await req.json();
    const access = await validateCloudflareAccess(req);
    return NextResponse.json({ 
      message: 'Admin action completed',
      action: action,
      user: access.email,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
