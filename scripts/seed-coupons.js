const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function seed() {
    console.log("Seeding coupons...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const coupons = [
        {
            code: 'WELCOME50',
            type: 'percent',
            value: 50,
            active: true
            // removed show_on_offers_page
        },
        {
            code: 'FLAT100',
            type: 'flat',
            value: 100,
            active: true
        }
    ];

    const { error } = await supabase.from('coupons').upsert(coupons, { onConflict: 'code' });
    if (error) console.error("Error seeding coupons:", error);
    else console.log("✅ Added coupons (WELCOME50, FLAT100). Refresh Offers page!");
}
seed();
