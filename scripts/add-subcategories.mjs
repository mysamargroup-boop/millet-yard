
// This script adds sample products with subcategories to demonstrate the subcategory slider functionality.
// Run with: node scripts/add-subcategories.mjs

import { randomUUID } from 'crypto';

const API_URL = 'http://127.0.0.1:3000/api';

async function main() {
  try {
    // 1. Fetch Categories to find a target
    console.log('Fetching categories...');
    const catRes = await fetch(`${API_URL}/categories`);
    if (!catRes.ok) throw new Error(`Failed to fetch categories: ${catRes.statusText}`);
    const categories = await catRes.json();

    if (categories.length === 0) {
      console.error('No categories found. Please add a category first.');
      return;
    }

    // Pick the first category or a specific one
    const targetCategory = categories.find(c => c.id === 'artisan-decor') || categories[0];
    console.log(`Targeting category: ${targetCategory.name} (${targetCategory.id})`);

    // 2. Define subcategory names
    const subNames = ['Wall Art', 'Table Decor', 'Handcrafted Vases'];
    const subCategoryMap = {};

    // 3. Ensure subcategories exist as categories in the DB
    console.log('Ensuring subcategories exist...');
    for (const name of subNames) {
      let subCat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      
      if (!subCat) {
        console.log(`Creating category: ${name}...`);
        // Create new category
        const newCatId = name.toLowerCase().replace(/ /g, '-');
        const newCat = {
            id: newCatId,
            name: name,
            description: `Beautiful ${name}`,
            imageUrl: 'https://placehold.co/400x400',
            imageHint: name,
            action: 'create', // Special flag for our API
            data: {
                id: newCatId,
                name: name,
                description: `Beautiful ${name}`,
                image_url: 'https://placehold.co/400x400',
                image_hint: name,
                // We don't set parent_id because our schema seems flat, but we use it as sub_category in products
            }
        };

        const createRes = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCat)
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            console.error(`Failed to create category ${name}: ${err}`);
            continue;
        }
        subCat = await createRes.json();
      }
      
      subCategoryMap[name] = subCat.id;
      console.log(`Mapped '${name}' to ID: ${subCat.id}`);
    }

    // 4. Define sample products
    const productsToAdd = subNames.map((sub, i) => ({
      id: randomUUID(),
      name: `Sample ${sub} Item ${i+1}`,
      description: `A beautiful ${sub} item for your home.`,
      regular_price: 500 + (i * 100),
      sale_price: 450 + (i * 100),
      category_id: targetCategory.id,
      sub_category: subCategoryMap[sub], // Use the ID (UUID or string)
      image_url: 'https://placehold.co/400x400',
      inventory: 10,
      features: ['Handmade', 'Eco-friendly']
    }));

    // 5. Add products
    console.log('Adding products...');
    for (const product of productsToAdd) {
      if (!product.sub_category) {
          console.warn(`Skipping product ${product.name} because subcategory ID is missing.`);
          continue;
      }

      // Wrap in action for our API
      const payload = {
          action: 'create',
          data: product
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Failed to add ${product.name}: ${errText}`);
      } else {
        const data = await res.json();
        console.log(`Successfully added: ${product.name}`);
      }
    }

    console.log('\nDone! Now verify the subcategory slider on the category page.');
    console.log(`URL: http://localhost:3000/collections/${targetCategory.id}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
