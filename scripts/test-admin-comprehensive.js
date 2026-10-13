const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const API_BASE_URL = 'http://127.0.0.1:8787'; // Testing locally
const API_KEY = process.env.WORKER_API_KEY;

const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
};

async function getRealProduct() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const products = await res.json();
        return products && products.length > 0 ? products[0] : null;
    } catch (e) {
        console.error('Failed to fetch real product:', e.message);
        return null;
    }
}

async function testCreateCategory() {
    console.log('\n--- 1. Testing Create Category ---');
    const categoryName = `Test Category ${Date.now()}`;
    const slug = `test-cat-${Date.now()}`;
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: categoryName,
                slug: slug,
                description: 'Test Description'
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Success: Category created: ${categoryName}`);
            return data;
        } else {
            console.error(`❌ Failed: ${JSON.stringify(data)}`);
        }
    } catch (e) { console.error('❌ Error:', e.message); }
}

async function testCreateProduct() {
    console.log('\n--- 2. Testing Create Product ---');
    const productName = `Test Product ${Date.now()}`;
    const productId = `test_prod_${Date.now()}`;
    try {
        const payload = {
            action: 'create',
            data: {
                id: productId,
                name: productName,
                regular_price: 1499,
                sale_price: 999,
                category_id: 'cat_decor',
                description: 'Test Product Description',
                inventory: 50,
                short_description: 'Test Short Description',
                image_url: 'https://images.unsplash.com/photo-1544061807-68b698bb2f9b?w=400&q=80'
            }
        };
        console.log('Sending payload:', JSON.stringify(payload, null, 2));
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Success: Product created: ${productName} (ID: ${productId})`);
            return data;
        } else {
            console.error(`❌ Failed: ${JSON.stringify(data)}`);
        }
    } catch (e) { console.error('❌ Error:', e.message); }
}

async function testManualOrder(product) {
    if (!product) {
        console.warn('Skipping manual order because no product was provided.');
        return null;
    }
    console.log('\n--- 3. Testing Create Manual Order ---');
    const orderId = `MANUAL-${Date.now()}`;
    const payload = {
        orderId: orderId,
        customerName: 'Admin Manual',
        customerPhone: '9999999999',
        customerEmail: 'admin@example.com',
        customerAddress: 'Admin Office, New Delhi',
        payment_method: 'COD',
        items: [
            {
                id: product.id,
                name: product.name,
                quantity: 1,
                price: product.sale_price || product.regular_price || 999
            }
        ]
    };
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Success: Manual Order created: ${orderId} (DB ID: ${data.id})`);
            return data;
        } else {
            console.error(`❌ Failed: ${JSON.stringify(data)}`);
        }
    } catch (e) { console.error('❌ Error:', e.message); }
}

async function testOrderActions(orderId) {
    if (!orderId) return;
    
    console.log(`\n--- 4-6. Testing Order Actions for UUID: ${orderId} ---`);
    
    // Test Cancel
    console.log('Testing Cancel...');
    try {
        const cancelRes = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'cancel', orderId, cancelReason: 'Test Cancellation', adminNote: 'Admin test' })
        });
        const cancelData = await cancelRes.json();
        if (cancelRes.ok) console.log('✅ Success: Order Cancelled');
        else console.error(`❌ Cancel Failed: ${JSON.stringify(cancelData)}`);
    } catch (e) { console.error('❌ Error:', e.message); }

    // Test Return
    console.log('Testing Return...');
    try {
        const returnRes = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'return', orderId, returnReason: 'Test Return', adminNote: 'Admin test' })
        });
        const returnData = await returnRes.json();
        if (returnRes.ok) console.log('✅ Success: Order Returned');
        else console.error(`❌ Return Failed: ${JSON.stringify(returnData)}`);
    } catch (e) { console.error('❌ Error:', e.message); }

    // Test Refund
    console.log('Testing Refund...');
    try {
        const refundRes = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'refund', orderId, refundAmount: 500, refundReason: 'Test Refund', adminNote: 'Admin test' })
        });
        const refundData = await refundRes.json();
        if (refundRes.ok) console.log('✅ Success: Order Refunded');
        else console.error(`❌ Refund Failed: ${JSON.stringify(refundData)}`);
    } catch (e) { console.error('❌ Error:', e.message); }
}

async function testReviewActions(product) {
    if (!product) {
        console.warn('Skipping review actions because no product was provided.');
        return;
    }
    console.log('\n--- 7. Testing Review Actions ---');
    let reviewId;
    try {
        const createRes = await fetch(`${API_BASE_URL}/api/reviews`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                product_id: product.id, 
                rating: 5, 
                review_text: 'Admin test review', 
                customer_name: 'Admin Tester' 
            })
        });
        const review = await createRes.json();
        reviewId = review.id;
        if (reviewId) {
            console.log(`✅ Review created with ID: ${reviewId}`);
        } else {
            console.error(`❌ Review creation failed or returned no ID: ${JSON.stringify(review)}`);
            return;
        }
    } catch (e) { console.error('❌ Create Review Error:', e.message); return; }

    // Test Approve
    console.log('Testing Review Approve...');
    try {
        const approveRes = await fetch(`${API_BASE_URL}/api/reviews`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ reviewId, isApproved: true })
        });
        if (approveRes.ok) console.log('✅ Success: Review Approved');
        else console.error(`❌ Review Approve Failed: ${await approveRes.text()}`);
    } catch (e) { console.error('❌ Error:', e.message); }

    // Test Reject
    console.log('Testing Review Reject...');
    try {
        const rejectRes = await fetch(`${API_BASE_URL}/api/reviews`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ reviewId, isApproved: false })
        });
        if (rejectRes.ok) console.log('✅ Success: Review Rejected');
        else console.error(`❌ Review Reject Failed: ${await rejectRes.text()}`);
    } catch (e) { console.error('❌ Error:', e.message); }
}

async function testWhatsApp() {
    console.log('\n--- 8. Testing WhatsApp Messaging ---');
    try {
        const response = await fetch(`${API_BASE_URL}/api/send-whatsapp`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                to: '919999999999',
                body: 'Hello from Admin Test Script! This is a test message.'
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Success: WhatsApp message request sent');
        } else {
            console.error(`❌ Failed: ${JSON.stringify(data)}`);
        }
    } catch (e) { console.error('❌ Error:', e.message); }
}

async function runAllTests() {
    console.log(`Starting Admin Features Comprehensive Test against: ${API_BASE_URL}`);
    if (!API_KEY) {
        console.error('ERROR: WORKER_API_KEY is missing in .env.local');
        return;
    }

    const realProduct = await getRealProduct();

    await testCreateCategory();
    await testCreateProduct();
    const orderData = await testManualOrder(realProduct);
    if (orderData && orderData.id) {
        await testOrderActions(orderData.id);
    } else {
        console.warn('Skipping order actions because manual order creation failed.');
    }
    await testReviewActions(realProduct);
    await testWhatsApp();
    
    console.log('\n--- All Tests Completed ---');
}

runAllTests();
