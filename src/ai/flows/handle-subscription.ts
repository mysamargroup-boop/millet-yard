
'use server';

/**
 * @fileOverview This file defines a Genkit flow for handling new user subscriptions.
 * DISABLED: Genkit AI integration disabled to prevent console errors.
 * The subscription still works via direct WhatsApp API.
 */

import { z } from 'zod';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp-cloud';

const SubscriptionInputSchema = z.object({
  customerName: z.string().describe('The name of the subscriber.'),
  customerPhoneNumber: z.string().describe('The WhatsApp number of the subscriber.'),
});

export type SubscriptionInput = z.infer<typeof SubscriptionInputSchema>;

const SubscriptionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SubscriptionOutput = z.infer<typeof SubscriptionOutputSchema>;

// Direct implementation without Genkit AI
export async function handleSubscription(input: SubscriptionInput): Promise<SubscriptionOutput> {
  try {
    const ownerWhatsAppNumber = process.env.OWNER_WHATSAPP_NUMBER || '919691045405';

    // Send WhatsApp notification to owner
    const message = `🔔 New Subscriber!\n\nName: ${input.customerName}\nWhatsApp: ${input.customerPhoneNumber}\n\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

    await sendWhatsAppTextMessage({ to: ownerWhatsAppNumber, body: message });

    return { success: true, message: "Subscription processed successfully." };
  } catch (error) {
    console.error('[Subscription] Failed:', error);
    return { success: false, message: "Failed to process subscription." };
  }
}
