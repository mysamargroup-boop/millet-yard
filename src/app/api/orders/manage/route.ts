import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function POST(req: NextRequest) {
  try {
    const { orderId, status, reason, adminNote, refundAmount } = await req.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }
    
    const validStatuses = ['CANCELLED', 'RETURNED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status for order management' }, { status: 400 });
    }
    
    const response = await fetch(`${API.ORDERS_ADMIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'manage', 
        orderId,
        status,
        reason,
        adminNote,
        refundAmount 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to manage order');
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error managing order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
