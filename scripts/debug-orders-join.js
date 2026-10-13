
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJoin() {
    console.log('Testing Join Query...');

    // Matches route.ts query
    const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, payment_status, customer_address, customer:customers(address)')
        .limit(5);

    if (error) {
        console.error('Join Query Failed:', error);
    } else {
        console.log('Join Query Success. Rows:', data.length);
        if (data.length > 0) console.log('Sample:', JSON.stringify(data[0], null, 2));
    }
}

checkJoin();
