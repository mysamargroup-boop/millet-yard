/**
 * Cloudflare Worker Entry Point (Router)
 * 
 * This file acts as the central router for the Cloudflare Worker. Instead of containing
 * all the business logic, it delegates requests to specific handler files located in
 * the `src/handlers/` directory. This modular approach improves maintainability.
 * 
 * It manages:
 * 1. CORS headers for all requests.
 * 2. Routing based on URL paths.
 * 3. Scheduled events (Cron jobs).
 */

import { getCORSHeaders } from './utils/cors';

// Auth Handlers
import { handleAuthRequest } from './handlers/auth';
import { handleAdminLogin } from './handlers/admin';

// Product & Category Handlers
import { handleProducts, handleProductsAdmin, handleCategories } from './handlers/products';

// Order & Payment Handlers
import { handleOrders, handleOrdersAdmin, handleCreateOrder, handleCreatePayment } from './handlers/orders';
import { handleOrderStatus } from './handlers/order-status';

// Coupon Handlers
import { handleCoupons, handleCouponsAdmin } from './handlers/coupons';

// AI Chat Handler
import { handleChatRequest } from './handlers/chat';

// Communication Handlers
import { handleSendEmail } from './handlers/email';
import { handleSendWhatsApp, handleWhatsAppSendTemplate } from './handlers/messaging';
import { handleAdminNotifications, handleRegisterAdminToken } from './handlers/notifications';

// Scheduled Tasks - handled in scheduled() function below

// Content & Blog
import { handleBlogPosts } from './handlers/blog';
import { handleSiteSettings } from './handlers/settings';
import { handleSlidingCards, handleSiteImages } from './handlers/content';
import { handleVideos, handleTestimonials } from './handlers/media';

// Customer & Reviews
import { handleCustomerAddresses, handleCustomerProfile } from './handlers/customer';
import { handleSubscriptions } from './handlers/subscriptions';
import { handleReviews } from './handlers/reviews';

// Analytics
import { handleLeadAnalytics } from './handlers/analytics';

// Webhooks (External Services)
import { handleCashfreeWebhook, handleShiprocketWebhook, handlePaymentWebhook } from './handlers/webhooks';
import { handleHome } from './handlers/home';


export default {
  async fetch(request, env, ctx) {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // --- Public API Routes ---

    // Authentication (OTP based & Admin)
    if (path === '/api/auth' || path === '/api/auth/otp' || path === '/api/auth/verify' || path === '/api/auth/resend') {
      return handleAuthRequest(request, env);
    }
    if (path === '/api/auth/admin-login') {
      return handleAdminLogin(request, env);
    }

    // Product Catalog
    if (path === '/api/products') {
      return handleProducts(request, env);
    }
    if (path === '/api/admin/products') {
      return handleProductsAdmin(request, env);
    }
    if (path === '/api/categories') {
      return handleCategories(request, env);
    }

    // Ordering System
    if (path === '/api/orders') {
      return handleOrders(request, env);
    }
    if (path === '/api/orders/create') {
      return handleCreateOrder(request, env, ctx);
    }
    if (path === '/api/orders-admin') {
      return handleOrdersAdmin(request, env, ctx);
    }
    if (path === '/api/orders/status') {
      return handleOrderStatus(request, env);
    }
    if (path === '/api/create-payment') {
      return handleCreatePayment(request, env);
      // 'handleCreatePayment' might be redundant if 'handleCreateOrder' does it all, 
      // but keeping both for backward compatibility or separate flows.
    }

    // Coupons (Validation & Listing)
    if (path === '/api/coupons' || path === '/api/coupons/validate') {
      return handleCoupons(request, env);
    }

    // Homepage bundle (single call)
    if (path === '/api/home') {
      return handleHome(request, env);
    }

    // AI Chatbot
    if (path === '/api/chat') {
      return handleChatRequest(request, env);
    }

    // Blog & Content
    if (path === '/api/blog') {
      return handleBlogPosts(request, env);
    }
    if (path === '/api/site-settings') {
      return handleSiteSettings(request, env);
    }
    if (path === '/api/site-images') {
      return handleSiteImages(request, env);
    }
    if (path === '/api/sliding-cards') {
      return handleSlidingCards(request, env);
    }
    if (path === '/api/videos') {
      return handleVideos(request, env);
    }
    if (path === '/api/testimonials') {
      return handleTestimonials(request, env);
    }

    // Reviews & Subscriptions
    if (path === '/api/reviews') {
      return handleReviews(request, env);
    }
    if (path === '/api/subscribe') {
      return handleSubscriptions(request, env);
    }

    // Customer Account
    if (path === '/api/account/addresses') {
      return handleCustomerAddresses(request, env);
    }
    if (path === '/api/account/profile') {
      return handleCustomerProfile(request, env);
    }

    // --- Admin API Routes ---
    // Note: These handlers verify the 'x-api-key' header internally.

    if (path === '/api/admin/orders') {
      return handleOrdersAdmin(request, env, ctx);
    }
    if (path === '/api/admin/coupons') {
      return handleCouponsAdmin(request, env);
    }
    if (path === '/api/email' || path === '/api/send-email') {
      return handleSendEmail(request, env);
    }
    if (path === '/api/analytics/leads') {
      return handleLeadAnalytics(request, env);
    }

    // --- Messaging & Notifications ---
    if (path === '/api/send-whatsapp') {
      return handleSendWhatsApp(request, env);
    }
    if (path === '/api/whatsapp/send-template') {
      return handleWhatsAppSendTemplate(request, env);
    }
    if (path === '/api/admin/notifications') {
      return handleAdminNotifications(request, env);
    }
    if (path === '/api/admin/notifications/register') {
      return handleRegisterAdminToken(request, env, ctx);
    }

    // --- Webhooks (External Triggers) ---
    if (path === '/api/webhooks/cashfree') {
      return handleCashfreeWebhook(request, env);
    }
    if (path === '/api/webhooks/shiprocket') {
      return handleShiprocketWebhook(request, env);
    }
    if (path === '/api/webhooks/payment') {
      return handlePaymentWebhook(request, env);
    }

    // Default: 404 Not Found
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders(env, request),
        },
      }
    );
  },

  // Cron Triggers (Scheduled Tasks)
  // Configured in wrangler.toml to run periodically (e.g., specific times or intervals)
  async scheduled(event, env, ctx) {
    const { scheduled: handleCron } = await import('./handlers/cron');
    await handleCron(event, env, ctx);
  },
};
