import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function POST(req: NextRequest) {
  try {
    const { orderId, cancelReason, adminNote } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const response = await fetch(`${API.ORDERS_ADMIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'cancel', 
        orderId,
        cancelReason,
        adminNote 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      throw new Error(errorData.error || 'Failed to cancel order');
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
