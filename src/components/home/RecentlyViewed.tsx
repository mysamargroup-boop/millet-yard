'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BLUR_DATA_URL } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { useRef } from 'react';
import GradientHeading from '@/components/ui/GradientHeading';

export default function RecentlyViewed() {
    const { recentlyViewed, clearRecentlyViewed, isEmpty } = useRecentlyViewed();
    const scrollRef = useRef<HTMLDivElement>(null);

    if (isEmpty) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 280;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="py-8 md:py-12 bg-transparent relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <GradientHeading
                        text="Recently Viewed"
                        icon="Clock"
                        className="mb-0"
                        underlineClassName="hidden"
                        variant="left"
                        size="md"
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRecentlyViewed}
                            className="text-muted-foreground hover:text-foreground text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                        </Button>
                        <div className="hidden sm:flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('left')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('right')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Horizontal scroll container */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {recentlyViewed.slice(0, 10).map((product) => {
                        const categorySlug = product.category ? slugify(product.category.split(',')[0].trim()) : 'products';
                        return (
                            <Link
                                key={product.id}
                                href={`/collections/${categorySlug}/${product.id}`}
                                className="flex-shrink-0 w-[160px] sm:w-[200px] snap-start"
                            >
                                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                                    <div className="relative aspect-square">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            placeholder="blur"
                                            blurDataURL={BLUR_DATA_URL}
                                            sizes="200px"
                                        />
                                    </div>
                                    <CardContent className="p-2.5">
                                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-900 via-red-800 to-red-700 mt-0.5">
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
