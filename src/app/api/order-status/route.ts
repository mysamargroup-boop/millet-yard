// This file defines an API endpoint for checking the status of an order.
// Now uses Cloudflare Workers for consistency.

import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing query param: order_id' }, { status: 400 });
    }

    // Build headers for Workers
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

    // Call Cloudflare Workers for order status
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) throw new Error("NEXT_PUBLIC_WORKER_URL is not defined");

    const response = await fetch(`${workerUrl}/api/order-status?order_id=${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Workers order status error:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to fetch order status' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Order status check failed:', error);
    return NextResponse.json(
      { error: `Failed to fetch order status: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST handler for fetching orders by phone number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
    }

    // Build headers for Workers
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

    // Call Cloudflare Workers for orders by phone
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) throw new Error("NEXT_PUBLIC_WORKER_URL is not defined");

    const response = await fetch(`${workerUrl}/api/order-status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone }),
    });


    const data = await response.json();

    if (!response.ok) {
      console.error('Workers order status error:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to fetch orders' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Order fetch failed:', error);
    return NextResponse.json(
      { error: `Failed to fetch orders: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

