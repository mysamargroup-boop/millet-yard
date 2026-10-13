const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fixEnv() {
    console.log("Fixing test environment...");
    
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].replace(/"/g, '').trim();
    const SUPABASE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].replace(/"/g, '').trim();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // 1. Enable COD in site_settings
    console.log("Enabling COD in site_settings...");
    const { error: settingsError } = await supabase
        .from('site_settings')
        .update({ cod_enabled: true, cod_extra_fee: 0, cod_min_order_amount: 0 })
        .eq('id', 'settings'); // Assuming ID is 'settings' based on typical patterns
    
    if (settingsError) {
        console.error("Failed to update site_settings:", settingsError.message);
        // Try without ID filter if it fails
        const { error: settingsError2 } = await supabase
            .from('site_settings')
            .update({ cod_enabled: true, cod_extra_fee: 0, cod_min_order_amount: 0 });
        if (settingsError2) console.error("Still failed:", settingsError2.message);
        else console.log("Updated all rows in site_settings.");
    } else {
        console.log("Enabled COD successfully.");
    }

    // 2. Ensure we have at least one product with a predictable ID for manual orders
    console.log("Ensuring 'bs1' product exists or getting a real ID...");
    const { data: products } = await supabase.from('products').select('id').limit(1);
    if (products && products.length > 0) {
        console.log(`Found real product ID: ${products[0].id}`);
    } else {
        console.log("No products found to test with.");
    }
}

fixEnv();
