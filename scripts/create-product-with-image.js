
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Config
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const IMAGE_PATH = path.join(__dirname, '..', 'Personalized Acrylic Photo Lamp 3.webp');

async function run() {
    try {
        console.log('--- STARTING PRODUCT CREATION ---');
        console.log('Uploading image to Cloudinary...');

        // 1. Upload Image
        const uploadResult = await cloudinary.uploader.upload(IMAGE_PATH, {
            folder: 'woody-products',
            public_id: 'personalized-acrylic-photo-lamp-3',
            resource_type: 'image'
        });

        console.log('Image Uploaded:', uploadResult.secure_url);

        // 2. Create Product
        const productData = {
            id: `PR-${Date.now()}`, // Simple ID generation
            name: 'Personalized Acrylic Photo Lamp',
            short_description: 'Custom acrylic lamp with your photo',
            description: '<p>Beautiful personalized acrylic lamp for gifts.</p>',
            regular_price: 1499.00,
            sale_price: 999.00,
            category_id: 'custom-gifts', // Assuming valid category, or will fail constraints if foreign key exists. 
            // Actually, let's check categories first or safe default.
            // Schema says category_id REFERENCES categories(id)
            image_url: uploadResult.secure_url,
            image_alt: 'Personalized Acrylic Photo Lamp',
            inventory: 100,
            is_active: true
        };

        // Need a valid category ID. Let's fetch one.
        const { data: categories } = await supabase.from('categories').select('id').limit(1);
        if (categories && categories.length > 0) {
            productData.category_id = categories[0].id;
        } else {
            // Create a category if none? Or tough luck.
            console.log('No categories found, using fallback "featured" which might fail if not exists');
            productData.category_id = 'featured';
            // Note: In real app we might want to ensure 'Decor' or similar exists.
        }

        console.log('Creating Product in DB...', productData);

        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            console.error('DB Insert Error:', error);
        } else {
            console.log('SUCCESS! Product Created:', data.id);
            console.log('Link:', data.image_url);
        }

    } catch (error) {
        console.error('Script Failed:', error);
    }
}

run();
