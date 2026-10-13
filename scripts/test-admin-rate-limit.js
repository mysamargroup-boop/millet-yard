
const http = require('http');
const https = require('https');

// Configuration
// We need to hit the Next.js API route directly.
// This assumes localhost:3000 is running. 
// If not, this test will fail to connect.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/auth/admin-login`;

function postRequest(urlStr, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const lib = url.protocol === 'https:' ? https : http;

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = lib.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function testRateLimit() {
    console.log(`\n🚀 Testing Admin Rate Limiting`);
    console.log(`Target: ${ENDPOINT}\n`);

    const MAX_ATTEMPTS = 6; // Limit is 5, so 6th should fail with 429

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        const start = Date.now();
        try {
            const res = await postRequest(ENDPOINT, { email: 'fake@admin.com', password: 'wrongpassword' });

            const duration = Date.now() - start;

            // We expect 401 for valid attempts (Invalid credentials)
            // We expect 429 for blocked attempts

            let statusIcon = '❓';
            if (res.status === 401) statusIcon = '🔓'; // Open/Allowed (but wrong creds)
            if (res.status === 429) statusIcon = '🛑'; // Blocked

            console.log(`${statusIcon} Attempt ${i}: Status ${res.status} (${duration}ms)`);

            if (res.status === 429) {
                console.log('\n✅ Rate Limit Triggered Successfully!');
                return;
            }

        } catch (error) {
            console.error(`❌ Attempt ${i} Failed:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                console.log('⚠️  Server likely not running on localhost:3000. Start it with `npm run dev` separately.');
                process.exit(1);
            }
        }
    }

    console.log('\n❌ Rate Limit NOT triggered within expected attempts.');
    console.log('   Check if rate limiting logic is enabled or thresholds are higher.');
}

testRateLimit();
