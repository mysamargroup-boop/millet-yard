import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp-cloud';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Admin
    // For Next.js API routes, we use our session-based auth or x-api-key
    const authResult = await requireAdminAuth(req);
    if (authResult instanceof NextResponse) {
      // If it's a 401 response, check if x-api-key is provided (for compatibility with Worker)
      const apiKey = req.headers.get('x-api-key');
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return authResult;
      }
    }

    const payload = await req.json();
    const { action, orderId } = payload;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Fetch the order first to check existence and current status
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'cancel') {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
          admin_notes: payload.adminNote || order.admin_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp Notification
      if (order.customer_phone) {
        try {
          await sendWhatsAppTextMessage({
            to: order.customer_phone,
            body: `*Order Update* \n\nHello ${order.customer_name},\nYour order #${order.external_order_id} has been *Cancelled*. \nReason: ${payload.cancelReason || 'N/A'}`
          });
        } catch (e) { console.error('WhatsApp Notification Error (Cancel):', e); }
      }

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: order.status,
        new_status: 'CANCELLED',
        reason: payload.cancelReason || 'Cancelled by admin',
        admin_note: payload.adminNote || null,
        created_by: 'admin',
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (action === 'return') {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'RETURNED',
          admin_notes: payload.adminNote || order.admin_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp Notification
      if (order.customer_phone) {
        try {
          await sendWhatsAppTextMessage({
            to: order.customer_phone,
            body: `*Order Update* \n\nHello ${order.customer_name},\nYour order #${order.external_order_id} has been marked as *Returned*. \nReason: ${payload.returnReason || 'N/A'}`
          });
        } catch (e) { console.error('WhatsApp Notification Error (Return):', e); }
      }

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: order.status,
        new_status: 'RETURNED',
        reason: payload.returnReason || 'Returned by admin',
        admin_note: payload.adminNote || null,
        created_by: 'admin',
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (action === 'refund') {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'REFUNDED',
          admin_notes: payload.adminNote || order.admin_notes,
          updated_at: new Date().toISOString(),
          // payment_status: 'REFUNDED' if applicable
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp Notification
      if (order.customer_phone) {
        try {
          await sendWhatsAppTextMessage({
            to: order.customer_phone,
            body: `*Order Update* \n\nHello ${order.customer_name},\nA refund of *₹${payload.refundAmount}* has been processed for your order #${order.external_order_id}.`
          });
        } catch (e) { console.error('WhatsApp Notification Error (Refund):', e); }
      }

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: order.status,
        new_status: 'REFUNDED',
        reason: payload.refundReason || 'Refunded by admin',
        admin_note: payload.adminNote || `Amount: ${payload.refundAmount}`,
        created_by: 'admin',
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Admin order action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
