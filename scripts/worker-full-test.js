const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const gotModule = require('got');
const got = gotModule.default || gotModule;

// Configuration
const WORKER_URL = 'http://127.0.0.1:8787';
const ADMIN_API_KEY = 'IsInR5cCI6IkpXVCfed11d6f79a3a97e54c89604'; // From .env.local WORKER_API_KEY

const defaultHeaders = {
    'x-api-key': ADMIN_API_KEY,
    'Content-Type': 'application/json'
};

async function logStep(name) {
    console.log(`\n--- [STEP: ${name}] ---`);
}

async function apiCall(name, path, options = {}) {
    const url = `${WORKER_URL}${path}`;
    try {
        const response = await got(url, {
            method: options.method || 'GET',
            json: options.json,
            headers: { ...defaultHeaders, ...options.headers },
            throwHttpErrors: false
        });

        console.log(`[${name}] Status: ${response.statusCode}`);
        if (response.statusCode >= 400) {
            console.error(`[${name}] Error:`, response.body);
        } else {
            const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            return body;
        }
    } catch (error) {
        console.error(`[${name}] Exception:`, error.message);
    }
    return null;
}

async function main() {
    console.log('🚀 Starting Full Worker Test Suite...');

    const timestamp = Date.now();
    const testData = {
        categoryId: `test-cat-${timestamp}`,
        productId: `test-prod-${timestamp}`,
        orderExternalId: `TEST-ORD-${timestamp}`,
        phone: '9999999999',
        customerName: 'Node Tester'
    };

    // 1. Create Category
    await logStep('Create Category');
    const category = await apiCall('Create Category', '/api/categories', {
        method: 'POST',
        json: {
            action: 'create',
            data: {
                id: testData.categoryId,
                name: `Test Category ${timestamp}`,
                description: 'Created during node test'
            }
        }
    });

    // 2. Create Product
    await logStep('Create Product');
    const product = await apiCall('Create Product', '/api/admin/products', {
        method: 'POST',
        json: {
            action: 'create',
            data: {
                id: testData.productId,
                name: `Test Product ${timestamp}`,
                regular_price: 100,
                category_id: testData.categoryId,
                inventory: 50,
                description: 'Node test product'
            }
        }
    });

    // 3. Create Order (COD)
    await logStep('Create Order');
    const order = await apiCall('Create Order', '/api/orders/create', {
        method: 'POST',
        json: {
            external_order_id: testData.orderExternalId,
            customer_name: testData.customerName,
            customer_phone: testData.phone,
            payment_method: 'COD',
            items: [
                {
                    id: testData.productId,
                    quantity: 1
                }
            ]
        }
    });

    if (!order || !order.id) {
        console.error('Order creation failed, stopping test.');
        return;
    }

    const orderId = order.id;

    // 4. Test Payment Webhook (Mark as PAID)
    await logStep('Payment Webhook (Mark Paid)');
    await apiCall('Payment Webhook', '/api/webhooks/payment', {
        method: 'POST',
        json: {
            order_id: testData.orderExternalId,
            payment_status: 'SUCCESS',
            transaction_id: `TXN-${timestamp}`
        }
    });

    // 5. Add Review
    await logStep('Add Review');
    const review = await apiCall('Add Review', '/api/reviews', {
        method: 'POST',
        json: {
            product_id: testData.productId,
            rating: 5,
            comment: 'Great product! (Node Test)',
            customer_name: testData.customerName
        }
    });

    if (review && review.id) {
        // 6. Approve Review
        await logStep('Approve Review');
        await apiCall('Approve Review', '/api/reviews', {
            method: 'PUT',
            json: {
                reviewId: review.id,
                isApproved: true
            }
        });
    }

    // 7. Order Management: Cancel
    await logStep('Cancel Order');
    await apiCall('Cancel Order', '/api/admin/orders', {
        method: 'POST',
        json: {
            action: 'cancel',
            orderId: orderId,
            cancelReason: 'Testing cancel flow from node',
            adminNote: 'Cancelled by automated script'
        }
    });

    // 8. Order Management: Refund (Simulated)
    await logStep('Refund Order');
    await apiCall('Refund Order', '/api/admin/orders', {
        method: 'POST',
        json: {
            action: 'refund',
            orderId: orderId,
            refundAmount: 100,
            refundReason: 'Testing refund flow from node'
        }
    });

    // 9. Shiprocket Webhook (Simulate Shipment Status Change)
    await logStep('Shiprocket Status Sync');
    await apiCall('Shiprocket Webhook', '/api/webhooks/shiprocket', {
        method: 'POST',
        json: {
            awb: `AWB-${timestamp}`,
            status: 'shipped',
            current_status: 'out_for_delivery',
            order_id: testData.orderExternalId
        }
    });

    console.log('\n✅ All steps completed! (Except Invoice which is frontend-only)');
}

main().catch(err => console.error('FATAL:', err));
