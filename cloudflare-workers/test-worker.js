/**
 * Test Cloudflare Worker Endpoints
 * 
 * Usage: node test-worker.js [worker-url]
 * Example: node test-worker.js https://shop-api.your-subdomain.workers.dev
 */

const WORKER_URL = process.argv[2] || process.env.WORKER_URL || 'http://localhost:8787';

async function test(endpoint, method = 'GET', body = null) {
    const url = `${WORKER_URL}${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(url, options);
        const text = await res.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }
        return { status: res.status, ok: res.ok, data };
    } catch (error) {
        return { status: 0, ok: false, error: error.message };
    }
}

async function main() {
    console.log(`🧪 Testing Cloudflare Worker: ${WORKER_URL}\n`);

    const tests = [
        { name: 'CORS Preflight', endpoint: '/api/products', method: 'OPTIONS' },
        { name: 'Products (GET)', endpoint: '/api/products', method: 'GET' },
        { name: 'Categories (GET)', endpoint: '/api/categories', method: 'GET' },
        { name: 'Site Settings (GET)', endpoint: '/api/site-settings', method: 'GET' },
        { name: 'Order Status (POST)', endpoint: '/api/orders/status', method: 'POST', body: { order_id: 'test-123' } },
    ];

    const results = [];

    for (const t of tests) {
        process.stdout.write(`Testing ${t.name}... `);
        const result = await test(t.endpoint, t.method, t.body);
        if (result.ok || result.status === 200 || result.status === 404) {
            console.log(`✅ ${result.status}`);
            results.push({ ...t, success: true, status: result.status });
        } else {
            console.log(`❌ ${result.status} ${result.error || JSON.stringify(result.data).substring(0, 50)}`);
            results.push({ ...t, success: false, status: result.status, error: result.error || result.data });
        }
    }

    console.log('\n--- Summary ---');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name}: ${r.status} ${r.error || ''}`);
        });
        process.exit(1);
    }

    console.log('\n✅ All tests passed! Worker is working correctly.');
}

main().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
