
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addThemeGradientColumn() {
    console.log('Adding theme_gradient column to site_settings...');

    // We can't run raw SQL easily via JS client usually, unless we have an RPC or use postgres adapter.
    // BUT we can use the 'rpc' if we have a function, or just try to 'select' it and see error?
    // Actually, for schema changes, 'postgres' connection is needed usually.

    // However, often users have an 'exec_sql' function or similar.
    // If not, I can try to use a direct SQL via a custom RPC if it exists.

    // Checking if 'exec_sql' exists...
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS theme_gradient TEXT;' });

    if (rpcError) {
        console.log("RPC exec_sql failed (expected if not defined). Trying purely informative message.");
        console.error("Could not run SQL directly. Please run this in Supabase SQL Editor:");
        console.log("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS theme_gradient TEXT;");
    } else {
        console.log("Successfully added theme_gradient column via RPC.");
    }
}

addThemeGradientColumn();
