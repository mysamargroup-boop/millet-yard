import { createSupabaseAdmin } from '../utils/supabase';
import { sendWhatsAppTextMessage } from '../utils/messaging';

// Scheduled handler for cron jobs (runs every hour)
export async function scheduled(event, env, ctx) {
    console.log('[Cron] Running scheduled task at', new Date().toISOString());

    try {
        const supabase = createSupabaseAdmin(env);

        // 1. Check if cart abandonment is enabled
        const { data: settings } = await supabase
            .from('site_settings')
            .select('cart_abandonment_enabled, cart_abandonment_delay_hours, cart_abandonment_whatsapp_template')
            .maybeSingle();

        if (!settings?.cart_abandonment_enabled) {
            console.log('[Cron] Cart abandonment disabled');
            return;
        }

        const delayHours = settings.cart_abandonment_delay_hours || 2;
        const templateName = settings.cart_abandonment_whatsapp_template || 'cart_reminder';

        // 2. Get abandoned carts older than delay hours with phone numbers
        const cutoffTime = new Date(Date.now() - (delayHours * 60 * 60 * 1000)).toISOString();

        const { data: abandonedCarts, error: fetchError } = await supabase
            .from('abandoned_carts')
            .select('*')
            .eq('recovery_status', 'pending')
            .not('customer_phone', 'is', null)
            .lt('created_at', cutoffTime)
            .limit(50); // Process max 50 per hour

        if (fetchError) {
            console.error('[Cron] Error fetching abandoned carts:', fetchError);
            return;
        }

        if (!abandonedCarts || abandonedCarts.length === 0) {
            console.log('[Cron] No abandoned carts to process');
            return;
        }

        console.log(`[Cron] Found ${abandonedCarts.length} abandoned carts to remind`);

        // 3. Send WhatsApp reminders
        for (const cart of abandonedCarts) {
            try {
                // Format phone number for WhatsApp
                let phone = cart.customer_phone.replace(/\D/g, '');
                if (!phone.startsWith('91') && phone.length === 10) {
                    phone = '91' + phone;
                }

                // Get first item name for personalization
                const items = cart.cart_items || [];
                const firstItemName = items[0]?.name || 'your items';
                const itemCount = items.length;
                const totalAmount = cart.total_amount || 0;
                const cartUrl = `${env.PUBLIC_URL || 'https://business.woody.co.in'}/cart`;

                // Create personalized message
                const customerName = cart.customer_name || 'Dear Customer';
                const messageBody = `Hi ${customerName}! 🛒

You left ${itemCount} item(s) in your cart worth ₹${totalAmount}.

🎁 *${firstItemName}* and more are waiting for you!

Complete your order now: ${cartUrl}

Need help? Reply to this message!`;

                // Send WhatsApp text message (not template)
                const whatsappResponse = await sendWhatsAppTextMessage(env, {
                    to: phone,
                    body: messageBody,
                    previewUrl: true
                });

                // Update cart status
                await supabase
                    .from('abandoned_carts')
                    .update({
                        recovery_status: 'reminder_sent',
                        reminder_sent_at: new Date().toISOString()
                    })
                    .eq('id', cart.id);

                console.log(`[Cron] Sent reminder to ${phone}`);

            } catch (sendError) {
                console.error(`[Cron] Failed to send reminder for cart ${cart.id}:`, sendError);
            }
        }

        // 4. Cleanup old carts (expired after 15 days)
        const fifteenDaysAgo = new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)).toISOString();
        await supabase
            .from('abandoned_carts')
            .update({ recovery_status: 'expired' })
            .eq('recovery_status', 'pending')
            .lt('created_at', fifteenDaysAgo);

        // Delete carts older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();
        await supabase
            .from('abandoned_carts')
            .delete()
            .lt('created_at', thirtyDaysAgo);

        console.log('[Cron] Completed cart abandonment processing');

    } catch (error) {
        console.error('[Cron] Error in scheduled task:', error);
    }
}
