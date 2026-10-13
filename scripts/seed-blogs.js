const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function seed() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const blogs = [
        {
            slug: 'art-of-gifting',
            title: 'The Art of Gifting: Why Personalization Matters',
            author: 'Shashank Nema',
            content: 'Gifting is an art form. It is not just about the object, but the emotion behind it...',
            image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
            image_key: 'blog-1'
        },
        {
            slug: 'modern-desk-setup',
            title: 'Creating the Perfect Modern Wooden Desk Setup',
            author: 'Team Nema',
            content: 'Your workspace defines your productivity. Here is how to organize it with style...',
            image_url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=800&q=80',
            image_key: 'blog-2'
        },
        {
            slug: 'sustainable-decor',
            title: 'Why Sustainable Wooden Decor is the Future',
            author: 'Team Nema',
            content: 'Sustainability is more than a buzzword. It is a commitment to our planet...',
            image_url: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?auto=format&fit=crop&w=800&q=80',
            image_key: 'blog-3'
        },
        {
            slug: 'festive-guide',
            title: 'The Ultimate Guide to Festive Giving',
            author: 'Shashank Nema',
            content: 'Festivals bring us together. Make them memorable with these unique gift ideas...',
            image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
            image_key: 'blog-4'
        }
    ];

    const { error } = await supabase.from('blog_posts').upsert(blogs, { onConflict: 'slug' });
    if (error) console.error(error);
    else console.log("✅ Added 4 dummy blogs");
}
seed();
