const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function seed() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Add 3 dummy videos
    const videos = [
        {
            id: 'v-' + Date.now() + 1,
            type: 'instagram',
            url: 'https://instagram.com/p/dummy1',
            thumbnail_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
        },
        {
            id: 'v-' + Date.now() + 2,
            type: 'instagram',
            url: 'https://instagram.com/p/dummy2',
            thumbnail_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'
        },
        {
            id: 'v-' + Date.now() + 3,
            type: 'youtube',
            url: 'https://youtube.com/watch?v=dummy3',
            thumbnail_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80'
        }
    ];

    const { error } = await supabase.from('videos').insert(videos);
    if (error) console.error(error);
    else console.log("✅ Added 3 dummy videos");
}
seed();
