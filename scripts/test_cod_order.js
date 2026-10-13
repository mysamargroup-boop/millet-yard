// Test script for COD order creation
// Run with: node scripts/test_cod_order.js

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testCODOrder() {
    console.log('🧪 Testing COD Order Creation...\n');

    const orderData = {
        external_order_id: `COD-TEST-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '919876543210',
        customer_email: 'test@example.com',
        customer_address: '123 Test Street, Test City, 400001',
        status: 'PENDING',
        payment_status: 'COD',
        payment_method: 'COD',
        total_amount: 999,
        items: [
            {
                id: 'test-product-1',
                name: 'Test Product',
                quantity: 1,
                price: 999,
            },
        ],
        coupon_discount: 0,
        extra_note: 'Test COD order',
    };

    try {
        console.log('📤 Sending COD order request...');
        console.log('Order Data:', JSON.stringify(orderData, null, 2));

        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('\n✅ COD Order Created Successfully!');
            console.log('Response:', JSON.stringify(result, null, 2));
        } else {
            console.log('\n❌ COD Order Failed!');
            console.log('Error:', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('\n❌ Request Failed:', error.message);
    }
}

// Run test
testCODOrder();
