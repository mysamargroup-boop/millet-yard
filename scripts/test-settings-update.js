const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables manually since we are running standalone
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function testToggle() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Missing Supabase credentials in .env.local");
        return;
    }

    console.log("Connecting to Supabase...");
    const supabase = createClient(url, key);

    // 1. Fetch current settings
    // Note: using maybeSingle() in case multiple rows exist (to detect the duplicate issue too?)
    // But fix should have prevented new ones.
    const { data: rows, error: fetchError } = await supabase
        .from('site_settings')
        .select('*');

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    if (!rows || rows.length === 0) {
        console.error("No site_settings found!");
        // Create default?
        return;
    }

    if (rows.length > 1) {
        console.warn(`WARNING: Found ${rows.length} rows in site_settings! This confirms the duplication bug existed.`);
        console.log("IDs:", rows.map(r => r.id));
    }

    const current = rows[0]; // Use first one
    console.log(`Using Row ID: ${current.id}`);
    console.log(`Current 'customer_login_enabled': ${current.customer_login_enabled}`);

    // 2. Toggle Value
    const originalValue = current.customer_login_enabled;
    const newValue = !originalValue;
    console.log(`Attempting to set to: ${newValue}`);

    const { error: updateError } = await supabase
        .from('site_settings')
        .update({ customer_login_enabled: newValue })
        .eq('id', current.id);

    if (updateError) {
        console.error("Update Error:", updateError);
        return;
    }

    // 3. Verify
    const { data: updated } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', current.id)
        .single();

    console.log(`New 'customer_login_enabled': ${updated.customer_login_enabled}`);

    if (updated.customer_login_enabled === newValue) {
        console.log("✅ SUCCESS: Setting was successfully updated and saved.");
    } else {
        console.error("❌ FAILURE: Value did not change in DB.");
    }

    // 4. Revert
    console.log("Reverting to original value...");
    await supabase
        .from('site_settings')
        .update({ customer_login_enabled: originalValue })
        .eq('id', current.id);

    console.log("Done.");
}

testToggle().catch(console.error);
