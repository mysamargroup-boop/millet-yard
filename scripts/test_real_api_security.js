
// Node 18+ has built-in fetch. Removing requirement for node-fetch.


async function testSecureOrder() {
    const API_URL = 'http://localhost:3000/api/orders';

    console.log(`--- Testing Security of ${API_URL} ---`);

    // 1. Fetch a product to get its real ID and Price
    // We'll trust that there are products in the DB.
    // Ideally we'd fetch from /api/products first, but let's assume we know one or just try a random one and expect a specific error if not found.
    // For this test, let's try to 'guess' or use a known ID if possible. 
    // Actually, let's fetch products first to be dynamic.

    let productId;
    let realPrice;

    try {
        const productsParams = new URLSearchParams();
        // Try fetching products. If this fails, we can't test.
        // But wait, /api/products might be using the Worker now! 
        // Let's try to hit the Next.js API direct route if possible, or just the public URL.
        const prodRes = await fetch('http://localhost:3000/api/products');
        const products = await prodRes.json();

        if (products && products.length > 0) {
            const p = products[0];
            productId = p.id;
            realPrice = p.salePrice || p.regularPrice || p.price;
            console.log(`Found Product: ${p.name} (ID: ${productId}) - Real Price: ${realPrice}`);
        } else {
            console.error("No products found to test with.");
            return;
        }
    } catch (e) {
        console.error("Failed to fetch products:", e.message);
        return;
    }

    // 2. Attempt Malicious Order
    const maliciousPrice = 10; // Much lower than real price
    console.log(`\nAttempting to create order with CLIENT_PRICE: ${maliciousPrice} (Real: ${realPrice})`);

    const payload = {
        items: [
            { id: productId, quantity: 1, price: maliciousPrice } // Malicious price
        ],
        couponCode: null,
        customer_name: "Security Tester",
        customer_phone: "9999999999",
        total_amount: maliciousPrice, // Malicious Total
        subtotal_amount: maliciousPrice
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("Order Creation Failed:", err);
            return;
        }

        const order = await res.json();
        console.log("Order Created:", order);

        // 3. Verify Result
        if (Math.abs(order.total_amount - realPrice) < 0.1) {
            console.log("✅ SECURITY PASS: Server ignored client price and used Real Price.");
        } else if (order.total_amount === maliciousPrice) {
            console.error("❌ SECURITY FAIL: Server accepted malicious price!");
        } else {
            console.log(`⚠️ INDETERMINATE: Order Total (${order.total_amount}) matches neither.`);
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testSecureOrder();
