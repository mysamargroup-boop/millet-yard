const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function enableCOD() {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].replace(/"/g, '').trim();
    const SUPABASE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].replace(/"/g, '').trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("Enabling COD in site_settings...");
    const { error } = await supabase
        .from('site_settings')
        .update({ cod_enabled: true })
        .eq('id', true); // Based on diagnose output
    
    if (error) {
        console.error("Failed:", error.message);
        // Try update all if ID filter failed
        const { error: error2 } = await supabase.from('site_settings').update({ cod_enabled: true });
        if (error2) console.error("Update all failed:", error2.message);
        else console.log("Success: COD enabled for all rows.");
    } else {
        console.log("Success: COD enabled for ID:true.");
    }
}

enableCOD();
