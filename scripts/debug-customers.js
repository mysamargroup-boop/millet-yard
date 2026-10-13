
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCustomers() {
    console.log('Fetching customers...');
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching customers:', error);
    } else {
        if (data.length > 0) {
            console.log('Customer Keys:', Object.keys(data[0]));
        } else {
            console.log('No customers found.');
        }
    }
}

checkCustomers();
