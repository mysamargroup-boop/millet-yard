'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/types';
import GradientHeading from '@/components/ui/GradientHeading';

interface FeaturedCollectionsProps {
    categories: Category[];
}

const FeaturedCollections = ({ categories }: FeaturedCollectionsProps) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true });
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    // Robust check: get categories marked as featured, or fallback to available categories
    const displayCategories = (categories && categories.length > 0)
        ? (categories.some(c => c.is_featured) ? categories.filter(c => c.is_featured) : categories)
        : [];

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    if (!displayCategories || displayCategories.length === 0) {
        return null;
    }

    return (
        <section className="pt-4 pb-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                {/* Header - Left Aligned */}
                <div className="text-left mb-8">
                    <GradientHeading
                        icon="Sparkles"
                        title="Featured Millet Collections"
                        subtitle="Explore positive unpolished grains, stone-ground flours, and traditional nutrient-dense superfoods."
                        variant="left"
                        size="lg"
                        className="mb-0"
                    />
                </div>

                {/* Carousel with arrows on left/right */}
                <div className="relative">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <div className="overflow-hidden mx-6 md:mx-8" ref={emblaRef}>
                        <div className="flex -ml-4 touch-pan-y">
                            {displayCategories.map((category, index) => (
                                <div key={category.id} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 pl-4">
                                    <Link
                                        href={category.linkUrl || `/collections/${category.id}`}
                                        className="group block h-full relative overflow-hidden rounded-3xl bg-card shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all duration-500"
                                    >
                                        {/* Gradient Border Effect */}
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-accent/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                                        {/* Image Container */}
                                        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-emerald-950/20">
                                            {(() => {
                                                const rawUrl = category.imageUrl || (category as any).image_url;
                                                const safeSrc = (typeof rawUrl === 'string' && rawUrl.trim().length > 0 && !rawUrl.endsWith('/0.png'))
                                                    ? rawUrl
                                                    : '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png';
                                                return (
                                                    <Image
                                                        src={safeSrc}
                                                        alt={category.name || 'Millet Collection'}
                                                        fill
                                                        className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                                        sizes="(max-width: 768px) 85vw, 30vw"
                                                        priority={index < 3}
                                                    />
                                                );
                                            })()}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                            {/* Collection Badge */}
                                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/30 shadow-lg">
                                                <span className="text-xs font-semibold text-black uppercase tracking-wider">Collection</span>
                                            </div>

                                            {/* Content Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-headline tracking-tight drop-shadow-lg">
                                                    {category.name}
                                                </h3>
                                                {category.description && (
                                                    <p className="text-white/85 text-sm line-clamp-2 mb-4 max-w-[280px]">
                                                        {category.description}
                                                    </p>
                                                )}
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                                    <span>Explore</span>
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default FeaturedCollections;
