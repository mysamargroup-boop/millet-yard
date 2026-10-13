
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        console.log('--- TESTING PRODUCT CREATION WITH WEIGHT & DIMENSIONS ---');

        // Fetch a valid category
        const { data: categories } = await supabase.from('categories').select('id').limit(1);
        if (!categories || categories.length === 0) {
            console.error('No categories found. Please create a category first.');
            return;
        }
        const categoryId = categories[0].id;

        const testId = `TEST-${Date.now()}`;

        // Simulating the logic from actions.ts
        const weight = 1.5;
        const weightUnit = 'kg';
        let weightGrams = 0;
        if (weightUnit === 'kg') weightGrams = Math.round(weight * 1000);
        else if (weightUnit === 'g') weightGrams = Math.round(weight);

        const dimensions = { length: 10, width: 20, height: 30 };

        const productData = {
            id: testId,
            name: 'Test Product Fix',
            description: '<p>Test description</p>',
            regular_price: 100,
            category_id: categoryId,
            image_url: 'https://placehold.co/600x400',
            inventory: 10,
            weight_grams: weightGrams,
            dimensions_length: dimensions.length,
            dimensions_width: dimensions.width,
            dimensions_height: dimensions.height
        };

        console.log('Inserting product:', productData);

        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            console.error('FAILED: DB Insert Error:', error);
        } else {
            console.log('SUCCESS! Product Created:', data.id);
            console.log('Weight Grams (expected 1500):', data.weight_grams);
            console.log('Dimensions (expected 10x20x30):', data.dimensions_length, 'x', data.dimensions_width, 'x', data.dimensions_height);

            // Cleanup
            console.log('Cleaning up test product...');
            const { error: deleteError } = await supabase.from('products').delete().eq('id', testId);
            if (deleteError) console.error('Cleanup Error:', deleteError);
            else console.log('Cleanup successful.');
        }

    } catch (error) {
        console.error('Script Failed:', error);
    }
}

run();
