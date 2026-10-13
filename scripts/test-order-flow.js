/**
 * User Order Flow Test
 *
 * 1. GET /api/products – public, no auth
 * 2. POST /api/orders – customer COD order (no admin auth)
 * 3. GET /api/orders – without admin cookie → 401
 *
 * Run: node scripts/test-order-flow.js
 * Ensure: Next.js dev server is running (e.g. npm run dev) and BASE_URL points to it.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function request(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, ok: res.ok };
}

async function main() {
  console.log('BASE_URL:', BASE_URL);
  console.log('---\n1. GET /api/products (public, no auth)');

  const productsRes = await request('GET', '/api/products');
  if (!productsRes.ok) {
    console.log('FAIL: GET /api/products', productsRes.status, productsRes.data);
    process.exit(1);
  }

  const products = Array.isArray(productsRes.data) ? productsRes.data : [];
  const firstProduct = products[0];
  if (!firstProduct || !firstProduct.id) {
    console.log('SKIP: No products in DB. Add a product first, or mock product id in script.');
    console.log('Continuing to test POST /api/orders with a fake product id (expect 400)...');
  }

  const productId = firstProduct?.id || '00000000-0000-0000-0000-000000000000';
  console.log('OK:', productsRes.status, 'Products count:', products.length);
  if (firstProduct) {
    console.log('   Using first product id for order:', productId);
  }

  console.log('\n---\n2. POST /api/orders (customer COD order – no admin auth)');

  const codOrder = {
    external_order_id: `TEST-COD-${Date.now()}`,
    customer_name: 'Test User',
    customer_phone: '919876543210',
    customer_email: 'test@example.com',
    customer_address: 'Test Address, 110001',
    payment_method: 'COD',
    items: [{ id: productId, quantity: 1 }],
  };

  const orderRes = await request('POST', '/api/orders', codOrder);

  if (orderRes.status === 400 && orderRes.data?.error) {
    if (
      orderRes.data.error.includes('not found') ||
      orderRes.data.error.includes('No items') ||
      orderRes.data.error.includes('Cash on Delivery is currently disabled')
    ) {
      console.log('OK (validation):', orderRes.status, orderRes.data.error);
    } else {
      console.log('RESPONSE:', orderRes.status, orderRes.data);
    }
  } else if (orderRes.ok && orderRes.data?.id) {
    console.log('OK: Order created', orderRes.status, 'Order id:', orderRes.data.id, 'External id:', orderRes.data.external_order_id);
  } else {
    console.log('RESPONSE:', orderRes.status, orderRes.data);
  }

  console.log('\n---\n3. GET /api/orders (without admin cookie → expect 401)');

  const listRes = await request('GET', '/api/orders');
  if (listRes.status === 401) {
    console.log('OK: GET /api/orders returns 401 without admin auth (as expected)');
  } else {
    console.log('UNEXPECTED: GET /api/orders', listRes.status, listRes.data);
  }

  console.log('\n---\nDone. User order flow: COD hits POST /api/orders (no auth); admin list requires auth.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
