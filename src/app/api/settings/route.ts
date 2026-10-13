import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/actions';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // Rate limit public requests
    const rl = await checkRateLimit(req, { keyPrefix: 'settings_view', limit: 20, windowMinutes: 1 });
    if (!rl.allowed) return rl.response;
    const settings = await getSiteSettings();
    return NextResponse.json(settings || {}, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load settings' }, { status: 500 });
  }
}
