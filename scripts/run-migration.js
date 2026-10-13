
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"; // Local Supabase default

async function runMigration() {
    const client = new Client({
        connectionString: CONNECTION_STRING,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const sqlPath = path.join(__dirname, '..', 'supabase', 'sql', '10_add_payment_shipping_settings.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
