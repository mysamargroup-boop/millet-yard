// Test script to verify Supabase connection and categories
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('=== Supabase Connection Test ===');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('SERVICE_ROLE_KEY length:', supabaseServiceKey.length);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✓ Supabase client created');

async function testConnection() {
    try {
        console.log('\nFetching categories...');
        const { data, error } = await client
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('❌ Error fetching categories:', error);
            return;
        }

        console.log(`✓ Successfully fetched ${data?.length || 0} categories:`);
        data?.forEach((cat, index) => {
            console.log(`  ${index + 1}. ${cat.name} (id: ${cat.id})`);
        });
    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

testConnection().then(() => {
    console.log('\n=== Test Complete ===');
    process.exit(0);
});
