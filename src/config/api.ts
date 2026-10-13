if (typeof window !== 'undefined') {
  console.log('API Config:', {
    WORKER_URL: process.env.NEXT_PUBLIC_WORKER_URL,
    USE_NEXTJS_API: process.env.NEXT_PUBLIC_USE_NEXTJS_API
  });
}

export const API = {
  // Products & Categories - Switchable
  PRODUCTS: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/products'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/products',
  CATEGORIES: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/categories'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/categories',

  // Admin APIs - Switchable
  ORDERS_ADMIN: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/orders-admin'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/orders-admin',
  PRODUCTS_ADMIN: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/products' // Standard Next.js products endpoint
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/products-admin',

  ORDERS: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/orders'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/orders',
  ORDER_STATUS: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/order-status'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/order-status',
  AUTH_OTP_REQUEST: '/api/auth/otp/request',
  AUTH_OTP_VERIFY: '/api/auth/otp/verify',
  // Public content/settings (prefer Worker in Workers mode to avoid Vercel API hits)
  SITE_SETTINGS: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/site-settings'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/site-settings',
  SITE_IMAGES: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/site-images'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/site-images',
  SLIDING_CARDS: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/sliding-cards'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/sliding-cards',
  COUPONS_VALIDATE: '/api/coupons/validate',
  COUPONS_ADMIN: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/coupons'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/coupons',
  ADDRESSES: '/api/account/addresses',
  CREATE_ORDER: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/orders' // Use our secure Next.js route
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/orders/create', // Use Worker
  /** When set, frontend calls Worker directly for order create (saves Vercel serverless invocations). */
  ORDER_CREATE_URL: process.env.NEXT_PUBLIC_WORKER_URL ? (process.env.NEXT_PUBLIC_WORKER_URL + '/api/orders/create') : '',
  CASHFREE_WEBHOOK: '/api/webhooks/payment',
  // Chatbot: Switch between System (Next.js) and Worker (Cloudflare)
  CHAT: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/chat'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/chat',

  BLOG_POSTS: '/api/blog-posts',
  LEAD_ANALYTICS: '/api/lead-analytics',
  REVIEWS: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/reviews'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/reviews',

  // Homepage bundle (single call)
  HOME: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/home'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/api/home',
  SHIPROCKET_WEBHOOK: process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true'
    ? '/api/webhooks/shiprocket'
    : (process.env.NEXT_PUBLIC_WORKER_URL || '') + '/shiprocket-webhook',
  SEND_WHATSAPP: '/api/whatsapp/send',
  WHATSAPP_SEND_TEMPLATE: '/api/whatsapp/send-template',
};

export const API_ENDPOINTS = API;

export const getCouponValidationMethod = () => {
  // Check environment variable to decide validation method
  // In Vercel, we can use direct Supabase for speed if desired, or API route for abstraction.
  // For VPS (Cloudflare Workers logic usually), API route is safer/consistent.

  // Default to API route to be safe and consistent with "one-click switch" idea
  // unless explicitly told to use DIRECT.
  // However, the user previously wanted a switch. 
  // For now, returning 'api-route' ensures we use the /api/coupons/validate endpoint 
  // which effectively proxies or handles logic.

  return process.env.NEXT_PUBLIC_COUPON_VALIDATION_METHOD || 'api-route';
};
