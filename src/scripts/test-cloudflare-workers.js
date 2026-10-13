const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const gotModule = require('got');
const got = gotModule.default || gotModule;

const baseUrl =
  process.env.CF_WORKER_BASE_URL ||
  'https://shop-api.mysamargroup.workers.dev';

const accessClientId = process.env.CF_ACCESS_CLIENT_ID;
const accessClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

const defaultHeaders = {};

if (accessClientId && accessClientSecret) {
  defaultHeaders['CF-Access-Client-Id'] = accessClientId;
  defaultHeaders['CF-Access-Client-Secret'] = accessClientSecret;
} else {
  console.warn(
    '[cloudflare-access] CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET missing; requests may be blocked by Cloudflare Access',
  );
}

async function testEndpoint(name, options) {
  const method = options.method || 'GET';
  const endpointPath = options.path || '/';
  const url = new URL(endpointPath, baseUrl).toString();

  try {
    const response = await got(url, {
      method,
      json: options.json,
      searchParams: options.searchParams,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      throwHttpErrors: false,
      timeout: { request: 15000 },
    });

    const contentType = response.headers['content-type'] || '';
    let preview = response.body;

    if (typeof preview === 'string') {
      if (contentType.includes('application/json')) {
        try {
          const parsed = JSON.parse(preview);
          preview = JSON.stringify(parsed).slice(0, 200);
        } catch {
          preview = preview.slice(0, 200);
        }
      } else {
        preview = preview.slice(0, 200);
      }
    }

    console.log(`[${name}] ${response.statusCode}:`, preview);
  } catch (e) {
    console.error(`[${name}] EXCEPTION:`, e.message || e);
  }
}

async function verifyCloudflareApiToken() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.log('[cloudflare-api] CLOUDFLARE_API_TOKEN missing, skipping token verify');
    return;
  }

  try {
    const response = await got('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      throwHttpErrors: false,
      timeout: { request: 15000 },
    });

    console.log(
      '[cloudflare-api] token verify',
      response.statusCode,
      String(response.body || '').slice(0, 200),
    );
  } catch (e) {
    console.error('[cloudflare-api] EXCEPTION:', e.message || e);
  }
}

async function main() {
  console.log('Using Cloudflare Worker base URL:', baseUrl);

  await verifyCloudflareApiToken();

  const orderId = `TEST-${Date.now()}`;
  const testPhone = '8518024107';

  await testEndpoint('categories', {
    method: 'GET',
    path: '/categories',
  });

  await testEndpoint('products', {
    method: 'GET',
    path: '/products',
  });

  await testEndpoint('site-settings-get', {
    method: 'POST',
    path: '/site-settings',
    json: { action: 'get' },
  });

  await testEndpoint('subscriptions-list', {
    method: 'GET',
    path: '/subscriptions',
  });

  await testEndpoint('lead-analytics', {
    method: 'GET',
    path: '/lead-analytics',
  });

  await testEndpoint('create-order', {
    method: 'POST',
    path: '/create-order',
    json: {
      orderId,
      amount: 1,
      customerName: 'Test User',
      customerPhone: testPhone,
      customerEmail: 'test@example.com',
      returnUrl:
        process.env.TEST_RETURN_URL ||
        'https://example.com/order-confirmation',
      items: [],
    },
  });

  await testEndpoint('order-status', {
    method: 'GET',
    path: '/order-status',
    searchParams: { order_id: orderId },
  });

  await testEndpoint('orders-admin-list', {
    method: 'POST',
    path: '/orders-admin',
    json: { action: 'list' },
  });

  await testEndpoint('products-admin-list', {
    method: 'POST',
    path: '/products-admin',
    json: { action: 'list' },
  });

  const newProductId = `PROD-NODE-${Date.now()}`;

  await testEndpoint('products-admin-create', {
    method: 'POST',
    path: '/products-admin',
    json: {
      action: 'create',
      data: {
        id: newProductId,
        name: 'Node Test Product CF',
        short_description: 'Created from Node test script for Cloudflare Worker',
        regular_price: 1,
        category_id: 'desk-accessories',
      },
    },
  });

  await testEndpoint('products-admin-list-after-create', {
    method: 'POST',
    path: '/products-admin',
    json: { action: 'list' },
  });

  await testEndpoint('send-whatsapp', {
    method: 'POST',
    path: '/send-whatsapp',
    json: {
      data: {
        to: testPhone,
        message: 'Test message from Node Cloudflare Worker tester',
      },
    },
  });

  await testEndpoint('shiprocket-webhook', {
    method: 'POST',
    path: '/shiprocket-webhook',
    json: {
      event: 'test',
      payload: { from: 'node-tester' },
    },
  });

  await testEndpoint('payment-webhook', {
    method: 'POST',
    path: '/payment-webhook',
    json: {
      event: 'test',
      payload: { from: 'node-tester' },
    },
  });

  await testEndpoint('whatsapp-send-template', {
    method: 'POST',
    path: '/whatsapp-send-template',
    json: {
      data: {
        template_name: 'test_template',
        to: testPhone,
      },
    },
  });

  await testEndpoint('cashfree-webhook', {
    method: 'POST',
    path: '/cashfree-webhook',
    json: {
      order_id: orderId,
      order_status: 'PAID',
      payment_status: 'SUCCESS',
      order_amount: 1,
      customer_details: {
        customer_name: 'Test User',
        customer_phone: testPhone,
      },
      payment_session_id: 'TEST_SESSION_ID',
      transaction_id: 'TEST_TXN_ID',
    },
  });
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('UNEXPECTED ERROR:', e.message || e);
    process.exit(1);
  });
