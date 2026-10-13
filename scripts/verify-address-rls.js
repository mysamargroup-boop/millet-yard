
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRLS() {
    console.log('--- Verifying Address RLS with Anon Key ---');

    try {
        // 1. Get a test customer ID using ADMIN client
        const { data: customers, error: custError } = await supabaseAdmin
            .from('customers')
            .select('id')
            .limit(1);

        if (custError) throw custError;
        if (!customers || customers.length === 0) {
            console.log('No customers found to test with.');
            return;
        }

        const testCustomerId = customers[0].id;
        console.log(`Using customer ID: ${testCustomerId} (fetched via admin)`);

        // 2. Attempt to insert an address using ANON client
        console.log('Attempting to insert address (ANON)...');
        const { data: insertData, error: insertError } = await supabaseAnon
            .from('customer_addresses')
            .insert([
                {
                    customer_id: testCustomerId,
                    full_name: 'Test User (Node)',
                    address_line: '123 RLS Street',
                    city: 'Security City',
                    state: 'SafeState',
                    pincode: '000000',
                    is_default: false
                }
            ])
            .select();

        if (insertError) {
            console.error('Insert failed:', insertError.message);
        } else {
            console.log('Insert successful!');
            console.log('Inserted row:', insertData);
        }

        // 3. Attempt to select using ANON client
        console.log('Attempting to select addresses (ANON)...');
        const { data: addresses, error: selectError } = await supabaseAnon
            .from('customer_addresses')
            .select('*');

        if (selectError) {
            console.error('Select failed:', selectError.message);
        } else {
            console.log(`Select successful! Found ${addresses.length} addresses.`);
        }

    } catch (error) {
        console.error('Error during verification:', error.message);
    }
}

verifyRLS();
