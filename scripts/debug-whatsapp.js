
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch'); // Ensure node-fetch is available or use https

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
const TO_PHONE = '918982050516';
const TEMPLATE_NAME = 'otp_wb';

async function sendTestMessage() {
    console.log('🚀 Testing WhatsApp Send (Local Debug)');
    console.log(`To: ${TO_PHONE}`);
    console.log(`Template: ${TEMPLATE_NAME}`);
    console.log(`Phone ID: ${PHONE_NUMBER_ID}`);
    // console.log(`Token: ${ACCESS_TOKEN.slice(0, 10)}...`);

    const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

    // Test payload for otp_wb (Assuming 1 body variable for OTP)
    const payload = {
        messaging_product: 'whatsapp',
        to: TO_PHONE,
        type: 'template',
        template: {
            name: TEMPLATE_NAME,
            language: { code: 'en_US' }, // User said "English (US)"
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: '123456' } // Dummy OTP
                    ]
                }
            ]
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('\n📡 API Response:');
        console.log(JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('\n❌ FAILED');
        } else {
            console.log('\n✅ SENT');
        }

    } catch (error) {
        console.error('❌ Network/Script Error:', error);
    }
}

// Fallback for fetch if needed (since I saw issues earlier, but I'll try standard fetch first or use https)
// I will just use the https module to be safe since node-fetch might be missing/module type
const https = require('https');

function postRequest(urlStr, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
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

// Main execution using https
async function main() {
    console.log('🚀 Testing WhatsApp Send (Local Debug - Native HTTPS)');
    console.log(`To: ${TO_PHONE}`);
    console.log(`Template: ${TEMPLATE_NAME}`);

    const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
    const payload = {
        messaging_product: 'whatsapp',
        to: TO_PHONE,
        type: 'template',
        template: {
            name: TEMPLATE_NAME,
            language: { code: 'en_US' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: '123456' }
                    ]
                },
                // Add header param for testing if needed
                {
                    type: 'button',
                    sub_type: 'url',
                    index: 0,
                    parameters: [
                        { type: 'text', text: '123456' } // Often OTP templates have a button with the code
                    ]
                }
            ]
        }
    };

    // Let's try SIMPLEST payload first (Body only)
    const simplePayload = {
        messaging_product: 'whatsapp',
        to: TO_PHONE,
        type: 'template',
        template: {
            name: TEMPLATE_NAME,
            language: { code: 'en_US' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: '123456' }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: 0,
                    parameters: [
                        { type: 'text', text: '123456' }
                    ]
                }
            ]
        }
    };

    try {
        const res = await postRequest(url, simplePayload);
        console.log('\n📡 API Response:');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
