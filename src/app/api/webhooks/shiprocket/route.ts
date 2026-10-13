import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Forward to Workers
    const response = await fetch(`${API.SHIPROCKET_WEBHOOK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to process webhook');
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
