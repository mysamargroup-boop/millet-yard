const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://shop-api.mysamargroup.workers.dev';
const PHONE_NUMBER = '918982050516'; // User provided number with 91 prefix

function postRequest(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = lib.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(body);
                    }
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function testLoginFlow() {
    console.log(`\n🚀 Testing Login Flow for: ${PHONE_NUMBER}`);
    console.log(`Target URL: ${BASE_URL}\n`);

    try {
        // Step 1: Request OTP
        console.log('1️⃣  Requesting OTP...');
        const requestUrl = `${BASE_URL}/api/auth/otp/request`;

        const requestStart = Date.now();
        try {
            const requestData = await postRequest(requestUrl, { phone: PHONE_NUMBER });
            const requestDuration = Date.now() - requestStart;

            console.log(`✅ OTP Request Successful (${requestDuration}ms)`);
            console.log('   Response:', JSON.stringify(requestData, null, 2));

            if (requestData.hash) {
                console.log('\n✨ Hash received. The backend is ready to verify.');
                console.log('⚠️  CANNOT PROCEED to Verification step without the actual OTP sent to the user.');
                console.log('   If you have the OTP, you can manually verify using the frontend or a separate script.');
            } else {
                console.warn('⚠️  No hash received in response?');
            }

        } catch (e) {
            console.error('❌ OTP Request Failed:', e.message);
        }

    } catch (error) {
        console.error('❌ Script Error:', error.message);
    }
}

testLoginFlow();
