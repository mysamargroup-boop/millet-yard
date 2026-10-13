const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwjlatudbxmrdfiiagjk.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testFetch() {
    console.log('Starting parallel fetch...');
    const start = Date.now();

    try {
        const p1 = supabase.from('products').select('*').limit(5).then(res => { console.log('Products:', res.status); return res; });
        const p2 = supabase.from('categories').select('*').then(res => { console.log('Categories:', res.status); return res; });
        const p3 = supabase.from('site_images').select('*').then(res => { console.log('SiteImages:', res.status); return res; });
        const p4 = supabase.from('sliding_cards').select('*').eq('active', true).then(res => { console.log('SlidingCards:', res.status); return res; });
        const p5 = supabase.from('videos').select('*').then(res => { console.log('Videos:', res.status); return res; });

        await Promise.all([p1, p2, p3, p4, p5]);
        console.log(`Finished in ${Date.now() - start}ms`);
    } catch (e) {
        console.error('Error:', e);
    }
}

testFetch();
