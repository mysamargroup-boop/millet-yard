
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Button } from '../ui/button';
import { BLUR_DATA_URL } from '@/lib/constants';
import type { SiteImage } from '@/lib/types';
import { useRef } from 'react';

interface PromoSliderProps {
    siteImages: SiteImage[];
}

export default function PromoSlider({ siteImages }: PromoSliderProps) {
    const autoplayPlugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: false, playOnInit: true })
    );

    const getImage = (id: string, fallbackTitle: string, fallbackDate: string, href: string, fallbackImageUrl: string) => {
        const image = (siteImages || []).find(img => img.id === id);
        const imageUrl = (image?.imageUrl && !image.imageUrl.includes('picsum.photos') && !image.imageUrl.includes('error'))
            ? image.imageUrl
            : fallbackImageUrl;
        return {
            title: image?.name || fallbackTitle,
            date: (image as any)?.description || fallbackDate,
            image: { ...image, imageUrl, imageHint: image?.imageHint || 'millet superfood' },
            href: image?.linkUrl || href
        };
    };

    // Get slider items with authentic Millet Yard superfood routines
    const sliderItems = [
        getImage(
            'slider-superfood',
            'Millet Yard Daily Superfood Routine',
            '100% UNPOLISHED SHREE ANNA',
            '/collections/unpolished-millets',
            '/images/products/millet-yard-foxtail-millet-barnyard-millet-kodo-little-millet-gluten-free-500-gm/image_1.png'
        ),
        getImage(
            'slider-diabetic',
            'Diabetic Care & Prebiotic Fiber Combos',
            'CLINICALLY PROVEN LOW-GI',
            '/collections/superfood-combos',
            '/images/products/the-daily-fortify-duo-multigrain-flour-1kg-ragi-flour-1kg/image_1.png'
        ),
        getImage(
            'slider-laddoo',
            'Artisanal Bilona Ghee Ragi Laddoos',
            'ZERO REFINED SUGAR TREAT',
            '/collections/nutritious-laddoos',
            '/images/products/nutritious-ragi-laddoo/image_1.png'
        ),
    ];

    return (
        <section className="py-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <Carousel
                opts={{
                    align: 'start',
                    loop: true,
                }}
                plugins={[autoplayPlugin.current]}
                className="w-full"
            >
                <CarouselContent>
                    {sliderItems.map((item, index) => (
                        <CarouselItem key={index}>
                            <div className="px-4 md:px-1">
                                <Card className="overflow-hidden">
                                    <CardContent className="p-0 relative aspect-[16/9] md:aspect-[21/9]">
                                        <Image
                                            src={item.image.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={item.image.imageHint}
                                            placeholder="blur"
                                            blurDataURL={BLUR_DATA_URL}
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                        <div className="absolute inset-0 bg-black/30" />
                                        <div className="absolute inset-0 flex flex-col justify-center items-start text-white p-8 md:p-16">
                                            <p className="text-sm font-semibold tracking-wider">{item.date}</p>
                                            <h3 className="text-2xl md:text-4xl font-headline font-bold leading-tight max-w-md">
                                                {item.title}
                                            </h3>
                                            <Button asChild className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-md">
                                                <Link href={item.href}>ORDER NOW</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex" />
            </Carousel>
        </div>
    </section>
);
}
