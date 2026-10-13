
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// Load environment variables from .env.local
const envConfig = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const API_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://shop-api.mysamargroup.workers.dev';
const API_KEY = process.env.WORKER_API_KEY || 'IsInR5cCI6IkpXVCfed11d6f79a3a97e54c89604';

async function uploadImage() {
    const imagePath = path.join(__dirname, '../Personalized Acrylic Photo Lamp 3.webp');

    if (!fs.existsSync(imagePath)) {
        console.error('Image not found at root:', imagePath);
        console.log('Please ensure "Personalized Acrylic Photo Lamp 3.webp" exists in the root directory.');
        process.exit(1);
    }

    console.log('Uploading image to Cloudinary...');
    try {
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'products_auto',
            use_filename: true,
            unique_filename: false,
        });
        console.log('Image uploaded successfully:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        process.exit(1);
    }
}

async function createProduct(imageUrl) {
    console.log('Creating product in database...');

    const productData = {
        action: 'create',
        data: {
            id: `AUTO-${Date.now().toString().slice(-6)}`, // Generate shorter unique ID
            name: 'Automated Node Product',
            description: 'This product was created via Node.js automation script with a real uploaded image.',
            regular_price: 1999,
            sale_price: 1499,
            category_id: 'home-decor', // Ensure this category exists or use 'uncategorized'
            image_url: imageUrl,
            inventory: 100,
            tags: ['automated', 'node-test'],
            allow_image_upload: true
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY, // If using worker directly
                // Add CF Access headers if behind Access
                ...(process.env.CF_ACCESS_CLIENT_ID ? {
                    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
                    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
                } : {})
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.statue}: ${text}`);
        }

        const json = await response.json();
        console.log('Product created successfully:', json);
        return json;

    } catch (error) {
        console.error('Product creation failed:', error);
    }
}

async function main() {
    const imageUrl = await uploadImage();
    if (imageUrl) {
        await createProduct(imageUrl);
    }
}

main();
