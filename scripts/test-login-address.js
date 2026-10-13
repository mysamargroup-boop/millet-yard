
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const TEST_PHONE = "919999999999";

if (!WORKER_URL) {
    console.error('Missing NEXT_PUBLIC_WORKER_URL in .env.local');
    process.exit(1);
}


async function testFullFlow() {
    console.log('--- STARTING ENHANCED E2E TEST ---');
    console.log(`Worker URL Base: ${WORKER_URL}`);
    console.log(`Test Phone: ${TEST_PHONE}`);

    try {
        // 1. Check Orders (Verify 500 Fix)
        const orderUrl = `${WORKER_URL}/api/order-status`;
        console.log(`\n[1/5] Checking Orders at ${orderUrl}...`);
        const orderRes = await fetch(orderUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: TEST_PHONE })
        });
        const orderData = await orderRes.json();
        console.log('Step 1 Response:', JSON.stringify(orderData).substring(0, 100));
        if (orderRes.ok) {
            console.log(`Successfully fetched ${orderData.orders?.length || 0} orders.`);
        } else {
            throw new Error(`Order fetch failed: ${JSON.stringify(orderData)}`);
        }

        // 2. Request OTP
        const otpReqUrl = `${WORKER_URL}/api/auth/otp/request`;
        console.log(`\n[2/5] Requesting OTP at ${otpReqUrl} for ${TEST_PHONE}...`);
        const requestRes = await fetch(otpReqUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: TEST_PHONE })
        });
        const requestData = await requestRes.json();
        console.log('Step 2 Response:', JSON.stringify(requestData).substring(0, 200));

        if (!requestRes.ok) throw new Error(`OTP Request failed: ${JSON.stringify(requestData)}`);
        const { otp, hash } = requestData;

        // 3. Verify OTP
        const otpVerifyUrl = `${WORKER_URL}/api/auth/otp/verify`;
        console.log(`\n[3/5] Verifying OTP at ${otpVerifyUrl}...`);
        const verifyRes = await fetch(otpVerifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: TEST_PHONE, otp, hash })
        });
        const verifyData = await verifyRes.json();
        console.log('Step 3 Response:', JSON.stringify(verifyData).substring(0, 200));

        if (!verifyRes.ok) throw new Error(`OTP Verify failed: ${JSON.stringify(verifyData)}`);
        console.log(`Logged in as: ${verifyData.customer?.name || 'Unknown'} (ID: ${verifyData.customer?.id})`);

        // 4. Add Address (Full Schema)
        const addAddrUrl = `${WORKER_URL}/api/account/addresses`;
        console.log(`\n[4/5] Adding Address at ${addAddrUrl}...`);
        const addressData = {
            customer_phone: TEST_PHONE, // Explicit Identification
            full_name: "E2E Test User",
            address_line: "123 Schema Street",
            area: "Technical Park",
            city: "Bhopal",
            state: "MP",
            pincode: "462001",
            phone: "919988776655", // Address-specific phone (for courier)
            is_default: false
        };

        const addRes = await fetch(addAddrUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addressData)
        });

        const addResult = await addRes.json();
        console.log('Step 4 Response:', JSON.stringify(addResult).substring(0, 100));
        if (addRes.ok) {
            console.log('Address added successfully!');
        } else {
            throw new Error(`Failed to add address: ${addRes.status} ${JSON.stringify(addResult)}`);
        }

        // 5. Verify and Delete
        console.log('\n[5/5] Verifying and Deleting...');
        const listRes = await fetch(`${addAddrUrl}?phone=${TEST_PHONE}`);
        const listData = await listRes.json();
        const newAddr = listData.addresses?.find(a => a.full_name === "E2E Test User");

        if (newAddr) {
            console.log(`Found new address (ID: ${newAddr.id}). Deleting...`);
            const delRes = await fetch(`${addAddrUrl}?id=${newAddr.id}&phone=${TEST_PHONE}`, {
                method: 'DELETE'
            });

            const delData = await delRes.json();
            if (delData.success) {
                console.log('Address deleted successfully!');
            } else {
                console.error('Failed to delete address:', delData);
            }
        } else {
            console.error('Created address not found in list!');
        }

        console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');

    } catch (error) {
        console.error('\n--- TEST FAILED ---');
        console.error(error.message);
        process.exit(1);
    }
}

testFullFlow();
