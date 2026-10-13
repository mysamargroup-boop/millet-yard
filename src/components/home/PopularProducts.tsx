
'use client';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import type { Product } from '@/lib/types';
import { Flame } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { type CarouselApi } from "@/components/ui/carousel"
import GradientHeading from '@/components/ui/GradientHeading';

const PLACEHOLDER_PRODUCTS: Product[] = [
    {
        id: 'pp1',
        name: 'Unpolished Foxtail Millet (Kangni) 500g',
        price: 149,
        regularPrice: 199,
        salePrice: 149,
        imageUrl: '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
        category: 'Unpolished Millets',
        rating: 4.9,
        reviewCount: 142,
        badge: 'Bestseller',
        description: '100% unpolished positive grain, rich in Vitamin B12 and dietary fiber for balanced energy.',
        features: ['Unpolished', 'Low GI', 'Rich in B12'],
        inventory: 25
    },
    {
        id: 'pp2',
        name: 'Unpolished Kodo Millet (Varagu) 500g',
        price: 159,
        regularPrice: 210,
        salePrice: 159,
        imageUrl: '/images/products/copy-of-kodo-millet-shreeanna-500-gram/image_1.png',
        category: 'Unpolished Millets',
        rating: 4.9,
        reviewCount: 128,
        badge: 'Diabetic Friendly',
        description: 'Ancient grain rich in polyphenols and antioxidants, ideal for diabetic blood sugar management.',
        features: ['Low Glycemic Index', 'High Antioxidants'],
        inventory: 30
    },
    {
        id: 'pp3',
        name: 'Stone-Ground Barnyard Millet Atta 1kg',
        price: 249,
        regularPrice: 299,
        salePrice: 249,
        imageUrl: '/images/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour/image_1.png',
        category: 'Wholesome Atta',
        rating: 4.8,
        reviewCount: 96,
        badge: 'Gluten Free',
        description: 'Freshly ground unadulterated Sanwa flour, light on the stomach and packed with iron.',
        features: ['Stone-Ground', 'Gluten Free', 'High Iron'],
        inventory: 40
    },
    {
        id: 'pp4',
        name: 'Browntop Millet Atta (High Fiber) 1kg',
        price: 289,
        regularPrice: 349,
        salePrice: 289,
        imageUrl: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png',
        category: 'Wholesome Atta',
        rating: 4.9,
        reviewCount: 79,
        badge: 'Highest Fiber',
        description: 'The rarest supergrain with 12.5% natural dietary fiber for superior colon and gut health.',
        features: ['12.5% Fiber', 'Prebiotic Rich'],
        inventory: 20
    }
];

export default function PopularProducts({ products }: { products: Product[] }) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    const autoplayPlugin = useRef(
        Autoplay({
            delay: 3000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
            playOnInit: true,
        })
    );

    useEffect(() => {
        if (!api) {
            return;
        }

        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const isPlaceholder = !products || products.length === 0;

    let finalDisplayProducts: Product[];
    if (isPlaceholder) {
        finalDisplayProducts = PLACEHOLDER_PRODUCTS;
    } else {
        // Get popular products: sort by rating (desc), then by reviewCount (desc)
        // Take top 5 products that have ratings
        const popularProducts = products
            .filter(p => p.rating && p.rating > 0)
            .sort((a, b) => {
                // Primary: rating (desc)
                const ratingDiff = (b.rating || 0) - (a.rating || 0);
                if (ratingDiff !== 0) return ratingDiff;
                // Secondary: reviewCount (desc)
                return (b.reviewCount || 0) - (a.reviewCount || 0);
            })
            .slice(0, 10);

        // Fallback: if no rated products, show first 6 products
        finalDisplayProducts = popularProducts.length > 0
            ? popularProducts
            : products.slice(0, 10);
    }

    if (finalDisplayProducts.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-12 bg-transparent relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <GradientHeading
                    text="Popular Choice"
                    icon="Flame"
                    subtitle="Explore our most loved, highly-rated unpolished millets & organic superfoods"
                    variant="left"
                    size="lg"
                />

                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[autoplayPlugin.current]}
                    className="w-full"
                    setApi={setApi}
                >
                    <CarouselContent className="-ml-0.5 md:-ml-4">
                        {finalDisplayProducts.map((product) => (
                            <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-0.5 md:pl-4">
                                <div className="p-0.5">
                                    <ProductCard product={product} />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-6 bg-background/80 backdrop-blur-sm border-2 shadow-none" />
                    <CarouselNext className="hidden sm:flex -right-4 lg:-right-6 bg-background/80 backdrop-blur-sm border-2 shadow-none" />
                </Carousel>

                <div className="text-center mt-10">
                    <Button asChild size="lg" className="rounded-full px-8 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                        <Link href="/shop">Explore All Products</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
