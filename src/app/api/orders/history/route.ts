import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const response = await fetch(`${API.ORDERS_ADMIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'history', orderId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch order history');
    }

    const history = await response.json();
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching order history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
