const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function diagnose() {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].replace(/"/g, '').trim();
    const SUPABASE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].replace(/"/g, '').trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("--- Site Settings ---");
    const { data: settings, error: sError } = await supabase.from('site_settings').select('*');
    if (sError) console.error(sError);
    else console.log(JSON.stringify(settings, null, 2));

    console.log("\n--- Reviews Schema ---");
    const { data: reviews, error: rError } = await supabase.from('reviews').select('*').limit(1);
    if (rError) console.error(rError);
    else if (reviews.length > 0) console.log("Review Columns:", Object.keys(reviews[0]));
    else console.log("Reviews table empty.");
}

diagnose();
