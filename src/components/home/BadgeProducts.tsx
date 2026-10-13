/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FEATURED PRODUCTS / BADGE PRODUCTS SECTION
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This section shows ALL products that have any badge set in the database.
 * 
 * HOW IT WORKS:
 * - Products are fetched from Supabase "products" table.
 * - If a product has a non-empty "badge" field (anything other than "none" or empty),
 *   it will appear in this "Featured Products" carousel.
 * 
 * AVAILABLE BADGES (set via Admin → Products → Edit → Product Badge dropdown):
 *   "Best Seller"  → Also appears in the Bestsellers section
 *   "New"          → Marks product as newly added
 *   "Limited"      → Limited edition product
 *   "Trending"     → Currently trending product
 *   "Sale"         → Product is on sale
 *   "Hot"          → Hot/popular product
 *   "Exclusive"    → Exclusive product
 *   "Premium"      → Premium quality product
 *   "Featured"     → Specially featured product
 *   "Popular"      → Popular choice
 * 
 * TO ADD A NEW BADGE:
 *   1. Go to: src/components/admin/ProductForm.tsx
 *   2. Find the "Product Badge" <Select> dropdown
 *   3. Add a new <SelectItem value="YourBadge">YourBadge</SelectItem>
 *   4. That's it! Products with the new badge will automatically show here.
 * 
 * TO HIDE THIS SECTION:
 *   - Remove all badges from products in Admin, or
 *   - This section auto-hides if no products have badges.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
'use client';
import { Product } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import GradientHeading from '@/components/ui/GradientHeading';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Sparkles, Crown } from 'lucide-react';

export default function BadgeProducts({ products }: { products: Product[] }) {
    // Filter products that have ANY non-empty badge (e.g., "Best Seller", "New", "Limited", "Trending", etc.)
    // This section shows ALL badged products regardless of badge type.
    const badgedProducts = products.filter(p => p.badge && p.badge !== 'none' && p.badge.trim() !== '');

    if (badgedProducts.length === 0) {
        return null;
    }

    return (
        <section className="relative py-8 md:py-12 overflow-hidden bg-transparent">
            {/* Transparent background with subtle gradient removed to maintain theme */}

            <div className="container mx-auto px-4 relative">
                {/* Mobile Fade Edges */}
                <div className="md:hidden absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                {/* Premium Header */}
                <GradientHeading
                    text="Featured Products"
                    icon="Sparkles"
                    subtitle="Exclusive items you don't want to miss — handpicked for quality and style"
                    variant="centered"
                    size="lg"
                />

                {/* Mobile: 3 columns with center full, edges partial with shadows */}
                {/* Desktop: 5 columns */}
                <Carousel
                    opts={{
                        align: 'center',
                        loop: badgedProducts.length > 3,
                        dragFree: false,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2 md:-ml-4 py-4">
                        {badgedProducts.map((product, index) => (
                            <CarouselItem
                                key={product.id}
                                className="basis-[75%] md:basis-1/3 lg:basis-1/5 pl-2 md:pl-4"
                            >
                                <div className="h-full transform transition-all duration-300 hover:-translate-y-2 rounded-xl relative">
                                    {/* Shadow overlay for edge items on mobile */}
                                    <div className="md:hidden absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 pointer-events-none z-10 rounded-xl opacity-[var(--edge-shadow,0)]" />
                                    <ProductCard product={product} />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex -left-2 bg-white/80 backdrop-blur-sm shadow-lg border-purple-100 hover:bg-purple-50" />
                    <CarouselNext className="hidden sm:flex -right-2 bg-white/80 backdrop-blur-sm shadow-lg border-purple-100 hover:bg-purple-50" />
                </Carousel>
            </div>
        </section>
    );
}

