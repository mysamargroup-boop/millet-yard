const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function seed() {
    console.log("Adding 2 more videos...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const videos = [
        {
            id: 'v-' + Date.now() + 4,
            type: 'youtube',
            url: 'https://youtube.com/watch?v=dummy4',
            thumbnail_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80'
        },
        {
            id: 'v-' + Date.now() + 5,
            type: 'instagram',
            url: 'https://instagram.com/p/dummy5',
            thumbnail_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
        }
    ];

    const { error } = await supabase.from('videos').insert(videos);
    if (error) console.error("Error adding videos:", error);
    else console.log("✅ Added 2 more videos.");
}
seed();
