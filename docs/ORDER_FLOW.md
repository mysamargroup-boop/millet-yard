# User Order Flow – Kab Order Karega Toh Code Kaise Chalega

## Overview

Jab user checkout karke order place karta hai, do main flows hain:
1. **COD (Cash on Delivery)** – seedha order create, koi payment gateway nahi
2. **Prepaid** – pehle payment link/session, phir Cashfree checkout

**Worker-direct mode (Vercel limit bachane ke liye):** Agar `NEXT_PUBLIC_WORKER_URL` set hai, to frontend **seedha Cloudflare Worker** ko call karta hai (`/api/orders/create`). Isse Vercel par koi API route hit nahi hota, isliye serverless invocation limit consume nahi hoti. COD aur Prepaid dono isi Worker endpoint se handle hote hain.

---

## 1. COD Order Flow (Cash on Delivery)

### Step-by-step call order

**Jab `NEXT_PUBLIC_WORKER_URL` set hai (recommended for Vercel):**
```
User (CheckoutModal) 
  → POST {WORKER_URL}/api/orders/create (direct from browser)
    → Worker: handleCreateOrder() – payment_method === 'COD'
    → Supabase: products validate, site_settings (COD), coupon, order + order_items insert
  ← Order JSON
  → Redirect: /order-confirmation?order_id=COD-xxx
```

**Jab Worker URL set nahi (fallback):**
```
User (CheckoutModal) 
  → POST /api/orders (Next.js)
    → supabaseAdmin() se products validate
    → site_settings se COD check (cod_enabled, cod_min_order_amount, cod_extra_fee)
    → coupon validate (agar couponCode diya ho)
    → orders + order_items insert (Supabase)
  ← Order object
  → Redirect: /order-confirmation?order_id=COD-xxx
```

### Code path

| Step | File | Kya hota hai |
|------|------|----------------|
| 1 | `src/components/checkout/CheckoutModal.tsx` | User "Place Order" click → `handleOrderSubmit()` |
| 2 | Same | `paymentMethod === 'cod'` → `codOrderInput` banata hai |
| 3 | Same | `fetch('/api/orders', { method: 'POST', body: JSON.stringify(codOrderInput) })` |
| 4 | `src/app/api/orders/route.ts` | **POST** handler (no admin auth – customer order hai) |
| 5 | Same | `orderData` se `items`, `customer_phone`, `customer_name`, `customer_address`, `external_order_id`, `couponCode`, `payment_method` nikalta hai |
| 6 | Same | Products fetch karke price validate, total calculate |
| 7 | Same | COD ke liye site_settings se `cod_enabled`, `cod_extra_fee`, `cod_min_order_amount` check |
| 8 | Same | Coupon validate (agar `couponCode` diya) |
| 9 | Same | `orders` table me insert, phir `order_items` insert |
| 10 | Same | Response: created order JSON |
| 11 | CheckoutModal | `window.location.href = /order-confirmation?order_id=COD-xxx` |

### COD request body (frontend se)

```json
{
  "external_order_id": "COD-1739...",
  "customer_name": "...",
  "customer_phone": "91...",
  "customer_email": "...",
  "customer_address": "...",
  "status": "PENDING",
  "payment_status": "COD",
  "payment_method": "COD",
  "total_amount": 999,
  "items": [ { "id": "<product-uuid>", "quantity": 1, "name": "...", ... } ],
  "coupon_discount": 0,
  "extra_note": "..."
}
```

**Zaroori:** `items` array me har item me **`id`** (product ID) aur **`quantity`** hona chahiye; baaki optional. API server-side price validate karke total banata hai.

### API expectations (Next.js POST /api/orders)

- **Auth:** None (customer order – admin auth sirf GET /api/orders pe hai)
- **Body:** `items` (array, each `{ id, quantity }`), `customer_phone`, `customer_name`, `customer_address`, `external_order_id`
- **Optional:** `couponCode`, `payment_method` (COD ke liye `'COD'` ya `'cod'`), `customer_email`, `extra_note`, etc.
- **Service role:** Sirf server par `supabaseAdmin()` use hota hai – client ko key expose nahi hoti.

---

## 2. Prepaid Order Flow (Payment gateway)

### Step-by-step call order

```
User (CheckoutModal) 
  → createPaymentLink(paymentInput) 
    → POST /api/create-payment-link (Next.js)
      → API.CREATE_ORDER URL pe forward (config se)
```

**A) Agar `NEXT_PUBLIC_USE_NEXTJS_API !== 'true'` (default – Worker use):**

```
  → POST {WORKER_URL}/api/orders/create (Cloudflare Worker)
    → handleCreateOrder(): orderId, amount, items, customerName, customerPhone, returnUrl, etc.
    → Supabase: order + order_items insert (PENDING)
    → Cashfree API: payment session create
    ← payment_session_id / payments.url
  ← create-payment-link response
  → Cashfree checkout (browser) → payment complete → webhook
  → Redirect: /order-confirmation?order_id=WB-xxx
```

**B) Agar `NEXT_PUBLIC_USE_NEXTJS_API === 'true'`:**

- `API.CREATE_ORDER` = `'/api/orders'`
- `create-payment-link` same body **/api/orders** ko bhejta hai
- `/api/orders` sirf order create karta hai, **Cashfree session nahi banata**
- Isliye prepaid flow ke liye abhi Worker wala flow use karna sahi hai (ya phir alag create-payment route chahiye)

### Code path (Prepaid – Worker)

| Step | File | Kya hota hai |
|------|------|----------------|
| 1 | `CheckoutModal.tsx` | `paymentMethod === 'prepaid'` → `createPaymentLink(paymentInput)` |
| 2 | `src/lib/payment.ts` | `createServerPaymentLink({ orderId, amount, customerName, customerPhone, returnUrl, items })` |
| 3 | Same | `fetch('/api/create-payment-link', { method: 'POST', body })` |
| 4 | `src/app/api/create-payment-link/route.ts` | Body ko `API.CREATE_ORDER` URL pe forward (Worker URL + `/api/orders/create` ya `/api/orders`) |
| 5 | `cloudflare-workers/src/index.js` | `path === '/api/orders/create'` → `handleCreateOrder(request, env)` |
| 6 | `cloudflare-workers/src/handlers/orders.js` | `handleCreateOrder`: validate → order + order_items insert → Cashfree order create → return payment URL/session |
| 7 | CheckoutModal | Cashfree SDK open / redirect → user pay karta hai → webhook order update karta hai |

---

## 3. Flow diagram (short)

```
[User Checkout]
       |
       v
  Payment method?
   /        \
 COD        Prepaid
  |            |
  v            v
POST          createPaymentLink()
/api/orders     |
  |            v
  |     POST /api/create-payment-link
  |            |
  |            v
  |     POST Worker /api/orders/create
  |            |
  v            v
Next.js     Worker: order + Cashfree
orders         |
route          v
  |        Payment URL / session
  v            |
Order       Cashfree checkout
created         |
  |            v
  v        Webhook → order status update
Redirect      |
  |            v
  v        Redirect order-confirmation
/order-confirmation?order_id=...
```

---

## 4. Important files

| Purpose | File |
|--------|------|
| User checkout form & submit | `src/components/checkout/CheckoutModal.tsx` |
| COD + WhatsApp order API | `src/app/api/orders/route.ts` (POST) |
| Prepaid proxy | `src/app/api/create-payment-link/route.ts` |
| API URLs | `src/config/api.ts` (CREATE_ORDER, ORDERS) |
| Prepaid client helper | `src/lib/payment.ts` (createPaymentLink) |
| Worker create order + payment | `cloudflare-workers/src/handlers/orders.js` (handleCreateOrder) |
| Worker route | `cloudflare-workers/src/index.js` (`/api/orders/create`) |
| Order status check | `src/app/api/order-status/route.ts` / Worker |
| Order confirmation page | `src/app/order-confirmation/page.tsx` |

---

## 5. Security (order create vs admin)

- **POST /api/orders** (Next.js): **No admin auth** – customers yahi use karke order create karte hain. Server-side `supabaseAdmin()` use hota hai (service role key client pe kabhi nahi jati).
- **GET /api/orders** (Next.js): **Admin auth required** – sirf logged-in admin orders list dekhta hai.
- **Worker `/api/orders/create`**: Payment/create order ke liye – admin auth nahi; Worker apna validation karta hai (e.g. Cashfree credentials env se).

Isse user order flow sahi kaam karega aur admin panel secure rahega.
