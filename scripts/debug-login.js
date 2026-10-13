
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Config
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';
const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runDebug() {
    console.log('--- DEBUG LOGIN START ---');
    console.log('Worker URL:', WORKER_URL);

    // 1. Generate Random Phone
    const randomSuffix = Math.floor(Math.random() * 90000000);
    const phone = `91${10000000 + randomSuffix}`; // e.g. 9112345678
    console.log(`Testing with NEW phone number: ${phone}`);

    // 2. Request OTP
    console.log('Requesting OTP...');
    try {
        const reqRes = await fetch(`${WORKER_URL}/api/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });

        const reqData = await reqRes.json();
        console.log('Request OTP Status:', reqRes.status);
        console.log('Request OTP Body:', JSON.stringify(reqData, null, 2));

        if (!reqRes.ok) throw new Error(reqData.error || 'Failed request');

        const { hash } = reqData;
        const otp = reqData.otp || '339633'; // Try to use returned OTP if dev/test, otherwise guess or manual

        // NOTE: In production, we don't get the OTP back. 
        // BUT, if we use the test number logic or assuming we can't intercept SMS.
        // Wait, if it's a random number, we won't get the OTP unless we bypass.
        // The worker has logic: if (env.CONNECT_WHATSAPP && phone === env.CONNECT_WHATSAPP) otp = 339633.

        // This debug script might fail if we can't guess the OTP.
        // However, the USER'S failure happens *during `verify`* presumably?
        // Or is it during request?

        // If I can't verify, I can't test the INSERT logic.
        // Let's manually inject the OTP into the DB? No, it's stateless HMAC.
        // I need the secret to generate a valid hash for a fake OTP?
        // Or I can temporarily enable a bypass in the worker for checking.

        // Actually, let's verify if `request` works first. User said "login karo", usually implies the whole flow.

        // If I cannot verify without a real phone, I can check the `customers` table structure.

        // Let's try to simulate the INSERT directly using Supabase to see if it fails.
        console.log('Simulating DB Insert directly...');
        const { data, error } = await supabase
            .from('customers')
            .insert({
                phone,
                name: 'Debug User',
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('DIRECT DB INSERT FAILED!');
            console.error(error);
        } else {
            console.log('Direct DB Insert Success:', data);
            // Cleanup
            await supabase.from('customers').delete().eq('id', data.id);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

runDebug();
