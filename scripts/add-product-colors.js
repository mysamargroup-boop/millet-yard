const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function addColors() {
    console.log("Adding color swatches to a product...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Get the first product
    const { data: products } = await supabase.from('products').select('id, name').limit(1);

    if (!products || products.length === 0) {
        console.log("No products found.");
        return;
    }

    const product = products[0];
    console.log(`Updating product: ${product.name} (${product.id})`);

    // Define colors
    const colorOptions = [
        { name: 'Natural Wood', value: '#d2b48c' },
        { name: 'Dark Walnut', value: '#5d4037' },
        { name: 'Cherry Red', value: '#880e4f' }
    ];

    const { error } = await supabase
        .from('products')
        .update({
            color: 'Natural Wood',
            color_options: colorOptions
        })
        .eq('id', product.id);

    if (error) console.error("Error updating product:", error);
    else console.log("✅ Added color swatches to product.");
}
addColors();
