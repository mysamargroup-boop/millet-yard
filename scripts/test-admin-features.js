
const fs = require('fs');
const path = require('path');

// Load environment variables
const envConfig = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const API_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://shop-api.mysamargroup.workers.dev';
const API_KEY = process.env.WORKER_API_KEY;

const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(process.env.CF_ACCESS_CLIENT_ID ? {
        'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
    } : {})
};

async function testListProducts() {
    console.log('\n--- Testing List Products ---');
    try {
        // Usually GET /api/products or similar. Adjust endpoint based on Worker structure.
        // Based on previous files, PRODUCTS endpoint handles POST for actions, but maybe GET for list?
        // Let's try GET.
        const response = await fetch(`${API_BASE_URL}/api/products`, { headers });
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ List Products Success. Found ${data.length || 0} products.`);
        } else {
            console.error(`❌ List Products Failed: ${response.status}`);
            console.log(await response.text());
        }
    } catch (e) { console.error('❌ List Products Error:', e.message); }
}

async function testSiteSettings() {
    console.log('\n--- Testing Get Site Settings ---');
    try {
        const response = await fetch(`${API_BASE_URL}/api/site-settings`, { headers });
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Get Settings Success.`);
            // Verify critical fields
            if (data.payment_gateway) console.log(`   Payment Gateway: ${data.payment_gateway}`);
        } else {
            console.error(`❌ Get Settings Failed: ${response.status}`);
        }
    } catch (e) { console.error('❌ Get Settings Error:', e.message); }
}

async function testCreateCoupon() {
    console.log('\n--- Testing Create Coupon ---');
    const code = `TEST-${Date.now().toString().slice(-4)}`;
    try {
        const response = await fetch(`${API_BASE_URL}/api/coupons`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                action: 'create',
                data: {
                    code,
                    type: 'percent',
                    value: 10,
                    show_on_offers_page: false
                }
            })
        });

        if (response.ok || response.status === 200 || response.status === 201) {
            console.log(`✅ Create Coupon Success: ${code}`);
        } else {
            console.error(`❌ Create Coupon Failed: ${response.status}`);
            console.log(await response.text());
        }
    } catch (e) { console.error('❌ Create Coupon Error:', e.message); }
}

async function main() {
    console.log(`Testing against: ${API_BASE_URL}`);
    if (!API_KEY) console.warn('Warning: WORKER_API_KEY not found in .env.local');

    await testSiteSettings();
    await testListProducts();
    await testCreateCoupon();
}

main();
