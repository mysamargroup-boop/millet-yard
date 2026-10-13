
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrders() {
    console.log('Fetching orders...');
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Found ${orders.length} orders (showing max 10)`);

    if (orders.length > 0) {
        // Log distinct statuses
        const statuses = [...new Set(orders.map(o => o.status))];
        const paymentStatuses = [...new Set(orders.map(o => o.payment_status))];

        console.log('Distinct Statuses:', statuses);
        console.log('Distinct Payment Statuses:', paymentStatuses);

        // Check first order structure for amount fields
        const first = orders[0];
        console.log('First Order Amount Fields:', {
            total_amount: first.total_amount,
            amount: first.amount,
            total: first.total,
            price: first.price
        });
    } else {
        console.log('No orders found in the table.');
    }
}

checkOrders();
