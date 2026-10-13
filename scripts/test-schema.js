const { z } = require('zod');

const productSchema = z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    shortDescription: z.string().optional().or(z.literal('')),
    regularPrice: z.coerce.number().min(0, "Regular price cannot be negative"),
    salePrice: z.coerce.number().optional().or(z.literal(0)).transform(v => v === 0 ? undefined : v),
    category: z.string().min(1, "Category is required"),
    subCategory: z.string().optional().or(z.literal('')),
    imageUrl: z.string().url("Must be a valid URL").or(z.literal('')),
    imageAlt: z.string().optional().or(z.literal('')),
    imageHint: z.string().optional().or(z.literal('')),
    videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    imageAttribution: z.string().optional().or(z.literal('')),
    license: z.string().optional().or(z.literal('')),
    inventory: z.coerce.number().min(0, "Inventory can't be negative").default(0),
    features: z.string().optional().or(z.literal('')),
    galleryImages: z.string().optional().or(z.literal('')),
    specificDescription: z.string().optional().or(z.literal('')),
    tags: z.string().optional().or(z.literal('')),
    material: z.string().optional().or(z.literal('')),
    colorOptions: z.string().optional().or(z.literal('')),
    badge: z.string().optional().or(z.literal('')),
    allowImageUpload: z.enum(['on', 'off']).optional(),
    options: z.string().optional().or(z.literal('')), // JSON string
    variants: z.string().optional().or(z.literal('')), // JSON string
    weight: z.coerce.number().optional().or(z.literal(0)),
    weightUnit: z.string().optional().or(z.literal('')),
    length: z.coerce.number().optional().or(z.literal(0)),
    width: z.coerce.number().optional().or(z.literal(0)),
    height: z.coerce.number().optional().or(z.literal(0)),
    dimensionUnit: z.string().optional().or(z.literal('')),
});

function testValidation(label, data) {
    console.log(`\n--- Test: ${label} ---`);
    const result = productSchema.safeParse(data);
    if (result.success) {
        console.log('✅ Validation SUCCESS');
        console.log('Processed Data:', JSON.stringify(result.data, null, 2));
    } else {
        console.log('❌ Validation FAILED');
        console.log('Errors:', JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    }
}

// Case 1: Minimal valid data
testValidation('Valid Data', {
    id: 'test-1',
    name: 'Test Product',
    description: 'Test Description',
    regularPrice: '100',
    category: 'gifts',
    imageUrl: 'https://example.com/image.jpg',
    inventory: '10'
});

// Case 2: Empty Image URL (Now allowed by string.url().or(literal('')))
testValidation('Empty Image URL', {
    id: 'test-2',
    name: 'Test Product 2',
    description: 'Test Description 2',
    regularPrice: '100',
    category: 'gifts',
    imageUrl: '',
    inventory: '10'
});

// Case 3: Empty string for prices (coerce handles it? let's see)
testValidation('Empty regularPrice', {
    id: 'test-3',
    name: 'Test Product 3',
    description: 'Test Description 3',
    regularPrice: '',
    category: 'gifts',
    imageUrl: 'https://example.com/image.jpg',
    inventory: '10'
});

// Case 4: Category empty (Should still fail)
testValidation('Empty Category', {
    id: 'test-4',
    name: 'Test Product 4',
    description: 'Test Description 4',
    regularPrice: '100',
    category: '',
    imageUrl: 'https://example.com/image.jpg',
    inventory: '10'
});

// Case 5: Sale price as 0 (Should transform to undefined)
testValidation('Sale Price 0', {
    id: 'test-5',
    name: 'Test Product 5',
    description: 'Test Description 5',
    regularPrice: '100',
    category: 'gifts',
    imageUrl: 'https://example.com/image.jpg',
    inventory: '10',
    salePrice: '0'
});
