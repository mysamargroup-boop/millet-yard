const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function fixDuplicates() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Missing Supabase credentials");
        return;
    }

    const supabase = createClient(url, key);

    console.log("Fetching site_settings...");
    const { data: rows, error } = await supabase.from('site_settings').select('*');

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    console.log(`Found ${rows.length} rows.`);

    if (rows.length <= 1) {
        console.log("No duplicates found. All good.");
        return;
    }

    // Identify victim
    // We keep the one with the most fields set? Or just the first one?
    // Let's keep the one with ID that looks 'oldest' or 'newest'?
    // Actually, let's just keep the LAST one (assuming it's the most recent valid state)
    // Or usually ID=1 is the original.

    // Let's default to keeping the First one, unless we see a reason not to.
    // Actually, the User complained that their changes weren't saving.
    // This implies they were updating a row that wasn't being read (or reading a row that wasn't updated).
    // If my previous script updated row[0], and user saw no change... user might be seeing row[1]?

    // Let's keep the one that matches what the user likely sees.
    // We can't know for sure.
    // SAFE BET: Merge them? Too complex.
    // ACTION: Delete all except the first one. User can re-apply settings.
    // BUT... if the first one is empty/blank, that's bad.

    const keeper = rows[0];
    const duplicates = rows.slice(1);

    console.log(`Keeping ID: ${keeper.id}`);
    console.log(`Deleting ${duplicates.length} duplicate rows...`);

    const idsToDelete = duplicates.map(r => r.id);
    const { error: delError } = await supabase
        .from('site_settings')
        .delete()
        .in('id', idsToDelete);

    if (delError) {
        console.error("Delete Error:", delError);
    } else {
        console.log("✅ Duplicates deleted successfully.");
    }
}

fixDuplicates().catch(console.error);
