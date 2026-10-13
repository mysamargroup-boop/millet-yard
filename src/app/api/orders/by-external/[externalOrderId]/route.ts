
import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ externalOrderId: string }> }) {
  const { externalOrderId } = await params;
  try {
    const response = await fetch(`${API.ORDERS_ADMIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get-by-external',
        externalOrderId: externalOrderId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      throw new Error(errorData.error || 'Failed to fetch order');
    }

    const order = await response.json();
    return NextResponse.json(order);
  } catch (err: any) {
    console.error(`Error fetching order by external id ${externalOrderId}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to fetch order' }, { status: 500 });
  }
}
