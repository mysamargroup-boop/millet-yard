
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            SUPABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].replace(/"/g, '').trim();
        }
    }
} catch (e) { 
    console.log("Env error:", e); 
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addPopularProduct() {
    console.log('--- ADDING POPULAR PRODUCT ---');

    // 1. Get a category ID
    const { data: categories } = await supabase.from('categories').select('id').limit(1);
    const categoryId = categories && categories.length > 0 ? categories[0].id : 'cat_decor';

    // 2. Product Data
    const productData = {
        id: `pop-${Date.now()}`,
        name: 'Premium Artisan Wooden Tray',
        short_description: 'Top rated handcrafted tray',
        description: '<p>Our most popular artisan wooden tray, perfect for serving or as a decorative piece.</p>',
        regular_price: 2499,
        sale_price: 1999,
        category_id: categoryId,
        image_url: 'https://images.unsplash.com/photo-1549464100-2240b84433b9?w=800&q=80',
        image_alt: 'Premium Artisan Wooden Tray',
        inventory: 25,
        rating: 5.0, // High rating for popular choice
        review_count: 125, // High review count for popular choice
        badge: 'Popular Choice'
    };

    console.log('Inserting product:', productData.name);

    const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
    } else {
        console.log('SUCCESS! Popular Product added:', data.id);
    }
}

addPopularProduct();
