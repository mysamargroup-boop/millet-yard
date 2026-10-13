import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function POST(req: NextRequest) {
  try {
    const { orderId, returnReason, adminNote } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const response = await fetch(`${API.ORDERS_ADMIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'return', 
        orderId,
        returnReason,
        adminNote 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      throw new Error(errorData.error || 'Failed to process return');
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error processing return:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
