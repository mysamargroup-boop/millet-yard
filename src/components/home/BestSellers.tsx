'use client';

import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/lib/types';
import { Flame } from 'lucide-react';
import GradientHeading from '@/components/ui/GradientHeading';

type BestSellersProps = {
    products?: Product[]
}

export default function BestSellers({ products = [] }: BestSellersProps) {
    const bestSellerProducts = products
        .filter(p => p.badge && p.badge.toLowerCase() === 'best seller')
        .sort((a, b) => {
            // Sort by rating (desc)
            const ratingDiff = (b.rating || 0) - (a.rating || 0);
            if (ratingDiff !== 0) return ratingDiff;
            // Then by reviewCount (desc)
            return (b.reviewCount || 0) - (a.reviewCount || 0);
        });

    if (bestSellerProducts.length === 0) {
        return null;
    }

    return (
        <section className="relative py-8 md:py-12 bg-transparent">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-20 left-20 w-24 h-24 bg-orange-200/40 rounded-full blur-2xl" />
                <div className="absolute top-32 right-16 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-16 left-1/3 w-28 h-28 bg-yellow-200/35 rounded-full blur-2xl" />
                <div className="absolute bottom-32 right-1/4 w-20 h-20 bg-orange-300/25 rounded-full blur-2xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <GradientHeading
                    text="Bestsellers"
                    icon="Flame"
                    subtitle="Our most loved handcrafted items that customers can't get enough of"
                    variant="left"
                    size="lg"
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
                    {bestSellerProducts.slice(0, 10).map((product) => (
                        <div key={product.id} className="p-0.5 sm:p-0">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
