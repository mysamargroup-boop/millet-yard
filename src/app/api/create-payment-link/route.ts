// This file defines an API endpoint for creating a payment link.
// It acts as a secure server-side proxy to Cloudflare Workers.

import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Call Cloudflare Workers instead of Supabase Edge Function
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
      headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
      headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
    }
    
    if (process.env.WORKER_API_KEY) {
      headers['X-API-Key'] = process.env.WORKER_API_KEY;
    }

    const response = await fetch(`${API.CREATE_ORDER}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Cloudflare Workers invocation error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to create payment session" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Create payment link API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
