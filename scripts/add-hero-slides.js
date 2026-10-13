const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function seed() {
    console.log("Adding Hero Slides to site_images...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Check existing
    const { data: existing } = await supabase.from('site_images').select('id').ilike('id', 'hero-%');
    console.log(`Found ${existing?.length || 0} existing hero slides.`);

    const newSlides = [
        {
            id: 'hero-3',
            name: 'Premium Office Decor',
            description: 'Elevate your workspace with our wooden collection',
            image_url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1920&q=80',
            link_url: '/collections/office-decor',
            button_text: 'Explore Office',
            is_visible: true
        },
        {
            id: 'hero-4',
            name: 'Festive Season Sale',
            description: 'Flat 20% Off on Bulk Orders',
            image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1920&q=80',
            link_url: '/shop',
            button_text: 'Grab Deal',
            is_visible: true
        }
    ];

    const { error } = await supabase.from('site_images').upsert(newSlides);

    if (error) {
        console.error("Error adding slides:", error);
    } else {
        console.log("✅ Added 2 new hero slides (hero-3, hero-4). refresh the page!");
    }
}

seed().catch(console.error);
