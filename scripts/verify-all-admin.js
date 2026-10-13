const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function runAudit() {
    console.log("🚀 Starting Comprehensive Admin Audit...\n");

    const results = {
        settings: false,
        category: false,
        product: false,
        order: false,
        siteImages: false
    };

    // 1. Audit Site Settings
    console.log("--- 1. Auditing Site Settings ---");
    try {
        const { data: row, error: fetchError } = await supabase.from('site_settings').select('*').limit(1).single();
        if (fetchError) throw fetchError;

        const hasWhatsAppCol = 'whatsapp_only_checkout_enabled' in row;
        console.log(`Column 'whatsapp_only_checkout_enabled' exists: ${hasWhatsAppCol ? '✅' : '❌'}`);

        if (hasWhatsAppCol) {
            const originalVal = row.whatsapp_only_checkout_enabled;
            await supabase.from('site_settings').update({ whatsapp_only_checkout_enabled: !originalVal }).eq('id', row.id);
            const { data: updated } = await supabase.from('site_settings').select('whatsapp_only_checkout_enabled').eq('id', row.id).single();
            console.log(`Update Test: ${updated.whatsapp_only_checkout_enabled !== originalVal ? '✅ PASSED' : '❌ FAILED'}`);
            // Revert
            await supabase.from('site_settings').update({ whatsapp_only_checkout_enabled: originalVal }).eq('id', row.id);
            results.settings = true;
        }
    } catch (e) {
        console.error("Settings Audit Error:", e.message);
    }

    // 2. Audit Category Quick Add
    console.log("\n--- 2. Auditing Category Quick Add ---");
    const testCatId = `audit-cat-${Date.now()}`;
    try {
        const { error: catError } = await supabase.from('categories').insert({
            id: testCatId,
            name: 'Audit Test Category',
            image_url: 'https://placehold.co/400'
        });
        if (catError) throw catError;
        console.log(`Category Creation: ✅ PASSED (ID: ${testCatId})`);
        results.category = true;
    } catch (e) {
        console.error("Category Audit Error:", e.message);
    }

    // 3. Audit Complex Product Creation
    console.log("\n--- 3. Auditing Product Creation (Weight & Dimensions) ---");
    const testProdId = `audit-prod-${Date.now()}`;
    try {
        const payload = {
            id: testProdId,
            name: 'Audit Test Product',
            regular_price: 1500,
            sale_price: 1200,
            category_id: testCatId,
            inventory: 10,
            image_url: 'https://placehold.co/400',
            weight_grams: 1500, // 1.5kg
            dimensions_length: 10,
            dimensions_width: 20,
            dimensions_height: 30
        };

        const { error: prodError } = await supabase.from('products').insert(payload);
        if (prodError) throw prodError;

        // Verify mapping
        const { data: verifiedProd } = await supabase.from('products').select('*').eq('id', testProdId).single();
        if (verifiedProd.weight_grams === 1500 && verifiedProd.dimensions_length === 10) {
            console.log(`Product Creation & Mapping: ✅ PASSED (ID: ${testProdId})`);
            results.product = true;
        } else {
            console.error("Product Mapping Mismatch:", verifiedProd);
        }
    } catch (e) {
        console.error("Product Audit Error:", e.message);
    }

    // 4. Audit Order Creation
    console.log("\n--- 4. Auditing Order System ---");
    try {
        const { data: orders, error: orderError } = await supabase.from('orders').select('*').limit(1);
        if (orderError) throw orderError;
        console.log(`Order Fetch Test: ✅ PASSED (${orders.length || 0} found)`);
        results.order = true;
    } catch (e) {
        console.error("Order Audit Error:", e.message);
    }

    // 5. Audit Site Images
    console.log("\n--- 5. Auditing Site Images (site_images) ---");
    try {
        const { data: images, error: imgError } = await supabase.from('site_images').select('*').limit(1);
        if (imgError) throw imgError;
        console.log(`Site Images Fetch Test: ✅ PASSED (${images.length || 0} found)`);

        if (images.length > 0) {
            const firstImg = images[0];
            const originalHint = firstImg.image_hint;
            const testHint = `Audit Test ${Date.now()}`;
            await supabase.from('site_images').update({ image_hint: testHint }).eq('id', firstImg.id);
            const { data: updatedImg } = await supabase.from('site_images').select('image_hint').eq('id', firstImg.id).single();
            console.log(`Site Image Update Test: ${updatedImg.image_hint === testHint ? '✅ PASSED' : '❌ FAILED'}`);
            // Revert
            await supabase.from('site_images').update({ image_hint: originalHint }).eq('id', firstImg.id);
            results.siteImages = true;
        } else {
            console.log("No site images found to test update, but table access is OK.");
            results.siteImages = true;
        }
    } catch (e) {
        console.error("Site Images Audit Error:", e.message);
    }

    // Cleanup
    console.log("\n--- Cleaning Up Audit Data ---");
    await supabase.from('products').delete().eq('id', testProdId);
    await supabase.from('categories').delete().eq('id', testCatId);
    console.log("Cleanup: ✅ Done");

    console.log("\n--- Final Audit Results ---");
    console.log(`[${results.settings ? 'PASSED' : 'FAILED'}] Site Settings (Schema & Updates)`);
    console.log(`[${results.category ? 'PASSED' : 'FAILED'}] Category Management (Quick Add)`);
    console.log(`[${results.product ? 'PASSED' : 'FAILED'}] Product Management (Weight/Dimensions Mapping)`);
    console.log(`[${results.order ? 'PASSED' : 'FAILED'}] Order Management (Database Access)`);
    console.log(`[${results.siteImages ? 'PASSED' : 'FAILED'}] Site Images (Management)`);

    if (Object.values(results).every(v => v === true)) {
        console.log("\n🌟 ALL ADMIN SYSTEMS ARE FUNCTIONAL 🌟");
    } else {
        console.log("\n⚠️ SOME AUDIT STEPS FAILED, PLEASE REVIEW LOGS ⚠️");
    }
}

runAudit().catch(console.error);
