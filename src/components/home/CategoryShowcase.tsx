'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import type { Category, Product } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import GradientHeading from '@/components/ui/GradientHeading';

const FALLBACK_CATEGORY_IMAGE = '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png';

interface CategoryShowcaseProps {
    categories: Category[];
    products: Product[];
}

export default function CategoryShowcase({ categories, products }: CategoryShowcaseProps) {
    // 1. Prefer categories explicitly marked as trending
    const trendingList = categories.filter(c => !!c.is_trending);
    const candidateCategories = trendingList.length > 0 ? trendingList : categories;

    // 2. Map products into categories
    const categoriesWithProducts = candidateCategories
        .map((cat: Category) => {
            const catProducts = products.filter((p: Product) => {
                const pCat = String(p.category || (p as any).category_id || '').toLowerCase().trim();
                const cId = String(cat.id || '').toLowerCase().trim();
                const cName = String(cat.name || '').toLowerCase().trim();

                return pCat === cId ||
                    pCat === cName ||
                    (pCat && pCat.split(',').map(s => s.trim().toLowerCase()).includes(cId));
            });

            return {
                ...cat,
                products: catProducts.slice(0, 5)
            };
        })
        .slice(0, 10);

    if (categoriesWithProducts.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <GradientHeading
                    text="Trending Collections"
                    icon="TrendingUp"
                    subtitle="Handpicked favorites from our varied catalog"
                    variant="centered"
                    size="lg"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 pt-2 pb-6">
                    {categoriesWithProducts.map((category: any, index: number) => (
                        <CategoryCard key={category.id} category={category} products={category.products} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function CategoryCard({ category, products, index }: { category: Category; products: Product[]; index: number }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto slide if multiple products exist
    useEffect(() => {
        if (!products || products.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % products.length);
        }, 5000 + (index * 500));
        return () => clearInterval(interval);
    }, [products, index]);

    const nextSlide = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (products.length > 1) {
            setCurrentSlide((prev) => (prev + 1) % products.length);
        }
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (products.length > 1) {
            setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
        }
    };

    const currentProduct = products && products.length > 0 ? products[currentSlide] : null;

    // Robust image source resolution:
    // 1. Current slide product image
    // 2. Category image
    // 3. Fallback product image
    const rawSrc = currentProduct?.imageUrl ||
        (currentProduct as any)?.image_url ||
        category.imageUrl ||
        (category as any)?.image_url;

    const safeImageSrc = (typeof rawSrc === 'string' && rawSrc.trim().length > 0 && !rawSrc.includes('error') && !rawSrc.endsWith('/0.png'))
        ? rawSrc
        : FALLBACK_CATEGORY_IMAGE;

    const [imgSrc, setImgSrc] = useState(safeImageSrc);

    useEffect(() => {
        setImgSrc(safeImageSrc);
    }, [safeImageSrc]);

    const categoryUrl = category.linkUrl || `/collections/${category.id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="flex flex-col h-full"
        >
            <div className="flex-1 relative group">
                <Card className="flex-1 overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-md hover:shadow-xl transition-all duration-300 bg-card h-full group-hover:-translate-y-1">
                    <CardContent className="p-0 h-full relative aspect-[4/5]">
                        <Link href={categoryUrl} className="block w-full h-full relative">
                            {/* Base Image Container - Guaranteed 100% visible from initial render */}
                            <div className="relative w-full h-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                                <Image
                                    src={imgSrc}
                                    alt={currentProduct?.name || category.name}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    priority={index < 4}
                                    placeholder="blur"
                                    blurDataURL={BLUR_DATA_URL}
                                    onError={() => {
                                        setImgSrc(FALLBACK_CATEGORY_IMAGE);
                                    }}
                                />
                                {/* Bottom vignette gradient for contrast */}
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                            </div>

                            {/* Inner Info & Product title if sliding */}
                            {currentProduct && (
                                <div className="absolute inset-x-0 bottom-6 px-3 z-10 pointer-events-none text-center">
                                    <p className="text-[11px] md:text-xs text-white/90 font-medium line-clamp-1 drop-shadow-md">
                                        {currentProduct.name}
                                    </p>
                                </div>
                            )}
                        </Link>

                        {/* Navigation Arrows for multi-item slider */}
                        {products && products.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    onClick={prevSlide}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    onClick={nextSlide}
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}

                        {/* Dots Indicator */}
                        {products && products.length > 1 && (
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                                {products.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1 rounded-full transition-all duration-300 ${
                                            idx === currentSlide ? 'w-3 bg-white' : 'w-1 bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Floating Category Name Badge */}
                <Link
                    href={categoryUrl}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-max max-w-[90%] z-20 transition-transform duration-300 group-hover:scale-105"
                >
                    <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md border border-stone-200/80 dark:border-stone-700 text-stone-900 dark:text-stone-100">
                        <h3 className="text-xs md:text-sm font-bold font-headline text-center truncate">
                            {category.name}
                        </h3>
                    </div>
                </Link>
            </div>
        </motion.div>
    );
}
