
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Constructing a likely Cloudinary URL for the existing image
// Based on folder 'woody-products' and public_id 'personalized-acrylic-photo-lamp-3'
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const EXISTING_IMAGE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/woody-products/personalized-acrylic-photo-lamp-3`;

async function run() {
    try {
        console.log('--- STARTING PRODUCT CREATION (Existing URL) ---');
        console.log('Using Image URL:', EXISTING_IMAGE_URL);

        // 1. Get Category
        const { data: categories } = await supabase.from('categories').select('id').limit(1);
        const categoryId = (categories && categories.length > 0) ? categories[0].id : null;

        if (!categoryId) {
            console.error('No categories found. Cannot create product.');
            return;
        }

        // 2. Create Product
        const productData = {
            id: `TEST-NODE-${Date.now()}`,
            name: 'Node Created Product (Existing IMG)',
            short_description: 'Created via Node.js script using existing Cloudinary URL.',
            description: '<p>This is a test product to verify we can use existing image URLs.</p>',
            regular_price: 1299.00,
            sale_price: 899.00,
            category_id: categoryId,
            image_url: EXISTING_IMAGE_URL,
            image_alt: 'Test Product Existing Image',
            inventory: 50,
            is_active: true
        };

        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            console.error('DB Insert Error:', error);
        } else {
            console.log('SUCCESS! Product Created:', data.id);
            console.log('Image URL Used:', data.image_url);
        }

    } catch (error) {
        console.error('Script Failed:', error);
    }
}

run();
