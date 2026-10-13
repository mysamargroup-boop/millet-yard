import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearAdminSessionCookie } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': clearAdminSessionCookie(),
        },
      }
    );
  } catch (error: any) {
    console.error('Admin Logout Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
