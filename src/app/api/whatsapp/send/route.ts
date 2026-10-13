import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { API } from '@/config/api';

const requestSchema = z.object({
  to: z.string(),
  body: z.string(),
  previewUrl: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const data = requestSchema.parse(payload);

    // Call Cloudflare Workers instead of direct WhatsApp API
    const response = await fetch(`${API.SEND_WHATSAPP}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.to,
        body: data.body,
        previewUrl: data.previewUrl || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send WhatsApp message');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    const message =
      error?.message ||
      (typeof error === 'string' ? error : 'Unknown error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
