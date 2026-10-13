const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkOrders() {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].replace(/"/g, '').trim();
    const SUPABASE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].replace(/"/g, '').trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("--- Products Schema ---");
    const { data: pData, error: pError } = await supabase.from('products').select('*').limit(1);
    if (pError) console.error(pError);
    else if (pData.length > 0) console.log("Product Columns:", Object.keys(pData[0]));
    else console.log("Products table empty.");
}

checkOrders();
