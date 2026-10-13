
// Script to test a VALID order flow (Happy Path)

async function testValidOrder() {
    const API_URL = 'http://localhost:3000/api/create-payment-link';
    console.log(`--- Testing Valid Order Flow at ${API_URL} ---`);

    // 1. Fetch a real product to get valid ID and Price
    // We need a valid product ID to pass validation
    let product;
    try {
        // Try fetching products from public API
        const prodRes = await fetch('http://localhost:3000/api/products');
        const products = await prodRes.json();

        if (products && products.length > 0) {
            product = products[0]; // Pick first product
            console.log(`Using Product: ${product.name} (ID: ${product.id}, Price: ${product.salePrice || product.regularPrice})`);
        } else {
            console.error("No products found. Cannot test flow.");
            return;
        }
    } catch (e) {
        console.error("Failed to fetch products:", e.message);
        return;
    }

    // 2. Prepare Valid Payload
    // The CheckoutModal sends this structure to /api/create-payment-link
    const payload = {
        productName: product.name,
        totalCost: product.salePrice || product.regularPrice || 100,
        customerName: "Test User",
        customerPhoneNumber: "9999999999", // Valid 10 digit
        customerAddress: "123 Test St",
        advanceAmount: product.salePrice || product.regularPrice || 100, // Full payment
        items: [
            {
                id: product.id,
                name: product.name,
                quantity: 1,
                price: product.salePrice || product.regularPrice || 100,
                imageUrl: product.imageUrl
            }
        ]
    };

    console.log("Sending Payload:", JSON.stringify(payload, null, 2));

    // 3. Send Request
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("❌ Order/Payment Creation Failed:", err);
            return;
        }

        const data = await res.json();
        console.log("✅ Success! Response:", data);

        if (data.payment_session_id) {
            console.log("🎉 Payment Session ID received:", data.payment_session_id);
            console.log("This confirms the Order -> Worker -> Cashfree flow is working.");
        } else {
            console.log("⚠️ Order created but no payment session ID. Check logs.");
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testValidOrder();
