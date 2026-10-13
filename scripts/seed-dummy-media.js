const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function seedMedia() {
    console.log("Starting Dummy Media Seed...");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Missing credentials.");
        return;
    }

    const supabase = createClient(url, key);

    // Get 5 products
    const { data: products, error } = await supabase.from('products').select('id, name').limit(5);

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    if (!products || products.length === 0) {
        console.log("No products found.");
        return;
    }

    const dummyData = {
        media_url_1: 'https://videos.pexels.com/video-files/5977952/5977952-uhd_2560_1440_25fps.mp4', // Sample Video
        media_url_2: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', // Watch
        media_url_3: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'  // Shoe
    };

    console.log(`Updating ${products.length} products with dummy media...`);

    for (const p of products) {
        const { error } = await supabase
            .from('products')
            .update(dummyData)
            .eq('id', p.id);

        if (error) console.error(`Failed to update ${p.name}:`, error);
        else console.log(`✅ Updated: ${p.name}`);
    }
    console.log("Done.");
}

seedMedia().catch(console.error);
