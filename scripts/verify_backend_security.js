
// Simulation of Backend Logic for Verification

// --- 1. Product Creation Logic (from src/lib/actions.ts) ---
const createProductLogic = (formData) => {
    console.log("--- Simulating Product Creation (Server Action) ---");
    const name = formData.name;
    const regularPrice = parseFloat(formData.regularPrice);
    const salePrice = formData.salePrice ? parseFloat(formData.salePrice) : null;

    // Logic: effective price is salePrice if valid, else regularPrice
    let effectivePrice = regularPrice;
    if (salePrice && salePrice > 0) {
        effectivePrice = salePrice;
    }

    const newProduct = {
        id: "prod_" + Math.random().toString(36).substr(2, 9),
        name,
        regularPrice,
        salePrice,
        price: effectivePrice, // DB column 'price'
        stock: parseInt(formData.inventory)
    };

    console.log("Created Product:", newProduct);
    return newProduct;
};


// --- 2. Current Insecure Order Logic (src/app/api/orders/route.ts) ---
const insecureOrderLogic = (clientPayload) => {
    console.log("\n--- Simulating Current Insecure Order API ---");
    // The current API just takes the payload and inserts it.
    // Vulnerability: Client can send ANY total_amount

    const dbOrder = {
        id: "ord_" + Math.random().toString(36).substr(2, 9),
        ...clientPayload, // TRUSTING CLIENT
        status: "PENDING"
    };

    console.log("Inserted Order into DB:", dbOrder);
    return dbOrder;
};

// --- 3. Proposed Secure Order Logic ---
const secureOrderLogic = async (clientPayload, mockDbProducts) => {
    console.log("\n--- Simulating Proposed SECURE Order API ---");

    let calculatedTotal = 0;
    const secureItems = [];

    for (const item of clientPayload.items) {
        const product = mockDbProducts.find(p => p.id === item.id);
        if (!product) {
            console.error(`Product ${item.id} not found!`);
            return null;
        }

        // Use Server-Side Price
        const priceToUse = product.price; // This is the effective price calculated at creation
        const itemTotal = priceToUse * item.quantity;
        calculatedTotal += itemTotal;

        console.log(`Item: ${product.name}, Server Price: ${priceToUse}, Qty: ${item.quantity}, Item Total: ${itemTotal}`);

        secureItems.push({
            ...item,
            price: priceToUse // Override client price with server price
        });
    }

    // Coupon Logic (Placeholder)
    if (clientPayload.couponCode === "SAVE10") {
        console.log("Applying Server-Side Coupon: SAVE10 (10% off)");
        calculatedTotal = calculatedTotal * 0.9;
    }

    const secureOrder = {
        id: "ord_secure_" + Math.random().toString(36).substr(2, 9),
        items: secureItems,
        total_amount: calculatedTotal,
        status: "PENDING"
    };

    console.log("Calculated Secure Order:", secureOrder);
    return secureOrder;
};

// --- EXECUTION ---

// A. Admin creates a product
const formData = {
    name: "Golden Watch",
    regularPrice: "5000",
    salePrice: "4000", // On sale
    inventory: "10"
};
const product = createProductLogic(formData);

// B. Malicious Client attempts to buy it for cheap
const maliciousPayload = {
    items: [
        { id: product.id, quantity: 1, price: 500 } // Client says price is 500!
    ],
    total_amount: 500,
    customer_name: "Hacker"
};

// Test 1: Current Insecure Flow
const insecureResult = insecureOrderLogic(maliciousPayload);
if (insecureResult.total_amount === 500) {
    console.log("⚠️ VULNERABILITY CONFIRMED: Order accepted with client-manipulated price (500 instead of 4000).");
}

// Test 2: Proposed Secure Flow
const mockDb = [product];
secureOrderLogic(maliciousPayload, mockDb).then(secureResult => {
    if (secureResult.total_amount === 4000) {
        console.log("✅ SECURE LOGIC VERIFIED: Server ignored client price and used DB price (4000).");
    }
});
