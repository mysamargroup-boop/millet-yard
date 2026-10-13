
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function request(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Security Hardening Verification...\n');

    // 1. Test Rate Limiting on Public Route
    console.log('--- Testing Rate Limiting on /api/products (GET) ---');
    const MAX_PUBLIC_HITS = 35; // Limit is 30
    let rateLimited = false;
    for (let i = 0; i < MAX_PUBLIC_HITS; i++) {
        const res = await request('/api/products');
        if (res.status === 429) {
            console.log(`✅ Rate limit triggered at request ${i + 1}`);
            rateLimited = true;
            break;
        }
    }
    if (!rateLimited) console.log('❌ Rate limit NOT triggered on /api/products');

    // 2. Test Admin Auth with old (client-exposed) key
    console.log('\n--- Testing Admin Auth with OLD exposed key (should fail) ---');
    const resAuthOld = await request('/api/products', 'POST', { name: 'Test' }, {
        'x-api-key': 'IsInR5cCI6IkpXVCfed11d6f79a3a97e54c89604' // The old key from .env.local
    });
    if (resAuthOld.status === 401 || resAuthOld.status === 403) {
        console.log('✅ Access denied with old key (Correct)');
    } else {
        console.log(`❌ Access NOT denied with old key! Status: ${resAuthOld.status}`);
    }

    // 3. Test JWT Hardening (Simulate Production)
    // This is harder to test without restarting the server with NODE_ENV=production
    // But we can verify the fallback is used in dev.

    console.log('\n--- Testing Admin Auth with NO Credentials ---');
    const resNoAuth = await request('/api/orders-admin', 'POST', { action: 'cancel', orderId: 'none' });
    if (resNoAuth.status === 401) {
        console.log('✅ Access denied without credentials (Correct)');
    } else {
        console.log(`❌ Access NOT denied without credentials! Status: ${resNoAuth.status}`);
    }

    console.log('\n🏁 Verification Complete.');
}

runTests().catch(console.error);
