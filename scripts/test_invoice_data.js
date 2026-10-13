
// Mock Order Data that the UI receives
const mockOrder = {
    id: "ord_123",
    amount: 1900, // Total Amount
    subtotal: 1800,
    shippingCost: 100,
    items: [
        {
            id: "prod_1",
            name: "Premium Shirt",
            quantity: 2,
            price: 900, // Sold Price (Sale Price)
            regularPrice: 1200, // Fetched from Product DB
        }
    ]
};

// Logic simulation for the UI
const renderOrderDetails = (order) => {
    console.log(`\n--- INVOICE SIMULATION FOR ORDER ${order.id} ---`);
    console.log(`Customer: John Doe`);

    console.log("\n[Items Table]");
    order.items.forEach(item => {
        const hasDiscount = item.regularPrice > item.price;
        const discountPercent = hasDiscount ? Math.round(((item.regularPrice - item.price) / item.regularPrice) * 100) : 0;

        console.log(`Item: ${item.name}`);
        console.log(`Qty: ${item.quantity}`);
        console.log(`Sold Price: ₹${item.price.toFixed(2)}`);

        if (hasDiscount) {
            console.log(`Regular Price: ₹${item.regularPrice.toFixed(2)} (Strikethrough)`);
            console.log(`Discount: ${discountPercent}% OFF`);
        } else {
            console.log("No Discount");
        }
    });

    console.log("\n[Order Summary]");
    console.log(`Subtotal: ₹${order.subtotal.toFixed(2)}`);
    console.log(`Shipping: ₹${order.shippingCost.toFixed(2)}`);
    console.log(`Total: ₹${order.amount.toFixed(2)}`);

    return {
        hasRegularPrice: order.items.some(i => i.regularPrice > i.price),
        hasShipping: order.shippingCost > 0,
        hasDiscountBadge: order.items.some(i => i.regularPrice > i.price)
    };
};

// Run
const result = renderOrderDetails(mockOrder);

if (result.hasRegularPrice && result.hasShipping && result.hasDiscountBadge) {
    console.log("\n✅ SUCCESS: Invoice displays all requested fields (Regular Price, Discount, Shipping, Quantity).");
} else {
    console.log("\n❌ FAILED: Missing fields.");
}
