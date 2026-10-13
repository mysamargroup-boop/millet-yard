import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';
import { requireAdminAuth } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication for viewing lead analytics
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const response = await fetch(`${API.LEAD_ANALYTICS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'analytics' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to load lead analytics');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Lead analytics API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

