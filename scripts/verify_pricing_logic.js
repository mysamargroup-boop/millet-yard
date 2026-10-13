
// Simulation of logic found in src/lib/actions.ts and src/hooks/use-cart.ts

const createProduct = (name, price, regularPrice, salePrice) => {
    // Logic from src/lib/actions.ts (simplified)
    // If salePrice is present and valid, price (effective) is salePrice.
    // Otherwise it is regularPrice.

    let effectivePrice = regularPrice;
    if (salePrice && salePrice > 0 && salePrice < regularPrice) {
        effectivePrice = salePrice;
    }

    return {
        id: `prod_${Math.floor(Math.random() * 1000)}`,
        name,
        price: effectivePrice, // This is what is stored in DB 'price' column typically
        regularPrice: regularPrice,
        salePrice: salePrice,
        imageUrl: 'http://example.com/img.jpg'
    };
};

// Simulation of Cart Logic
const calculateTotals = (cart) => {
    // Logic from src/app/cart/page.tsx

    const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

    const originalCartTotal = cart.reduce((total, item) => {
        const originalPrice = item.product.regularPrice || item.product.price;
        return total + originalPrice * item.quantity;
    }, 0);

    const totalSavings = cart.reduce((acc, item) => {
        const regularPrice = item.product.regularPrice || item.product.price;
        return regularPrice > item.product.price
            ? acc + (regularPrice - item.product.price) * item.quantity
            : acc;
    }, 0);

    return { cartTotal: cartTotal, originalCartTotal: originalCartTotal, totalSavings: totalSavings };
};

// --- Execution ---

console.log("--- TEST CASE 1: Product with Sale Price ---");
// Admin fills: Regular: 1000, Sale: 800
const product1 = createProduct("Nike Shoes", 0, 1000, 800);
console.log("Created Product 1:", product1);

console.log("\n--- TEST CASE 2: Product WITHOUT Sale Price ---");
// Admin fills: Regular: 500
const product2 = createProduct("T-Shirt", 0, 500, null);
console.log("Created Product 2:", product2);

console.log("\n--- CART SIMULATION ---");
let cart = [];

// Add 1 Nike Shoe
cart.push({
    product: { ...product1 },
    quantity: 1
});

// Add 2 T-Shirts
cart.push({
    product: { ...product2 },
    quantity: 2
});

console.log("\nCart Items:");
cart.forEach((item, idx) => {
    console.log(`Item ${idx + 1}: ${item.product.name} x ${item.quantity} @ ${item.product.price}`);
});

const totals = calculateTotals(cart);
console.log("\n--- TOTALS CALCULATIONS ---");
console.log(`Subtotal (What user pays): ${totals.cartTotal}`);
console.log(`Original Total (MRP): ${totals.originalCartTotal}`);
console.log(`Total Savings: ${totals.totalSavings}`);

const expectedPay = 800 * 1 + 500 * 2; // 1800
const expectedOriginal = 1000 * 1 + 500 * 2; // 2000
const expectedSavings = 200;

if (totals.cartTotal === expectedPay && totals.originalCartTotal === expectedOriginal && totals.totalSavings === expectedSavings) {
    console.log("\n✅ SUCCESS: Logic matches expectations.");
} else {
    console.log("\n❌ FAILED: Values do not match expectations.");
    console.log(`Expected Pay: ${expectedPay}, Got: ${totals.cartTotal}`);
    console.log(`Expected Original: ${expectedOriginal}, Got: ${totals.originalCartTotal}`);
    console.log(`Expected Savings: ${expectedSavings}, Got: ${totals.totalSavings}`);
}
