'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GradientHeading from '@/components/ui/GradientHeading';
import { BLUR_DATA_URL } from '@/lib/constants';
import type { SiteImage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface SpotlightSectionProps {
    siteImages: SiteImage[];
}

export default function SpotlightSection({ siteImages }: SpotlightSectionProps) {
    const { settings } = useSettings();
    const sectionBg = settings.theme_gradient || 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%)';

    let slides = siteImages
        .filter(img => img.id.startsWith('spotlight-') && img.isVisible !== false)
        .sort((a, b) => a.id.localeCompare(b.id));

    // Dummy fallback
    if (slides.length === 0) {
        slides = [
            { id: 'spotlight-dummy-1', imageUrl: '/images/products/millet-yard-premium-traditional-aam-ka-achaar-mango-pickle-authentic-indian-homemade-style-mango-pickle-1-kg/image_1.png', linkUrl: '/collections/traditional-pickles', name: 'Traditional Aam Ka Achaar', description: 'The traditional mango pickle tastes truly homemade and takes me back to village roots. Perfectly balanced, cold-pressed mustard oil, and zero chemical preservatives.', buttonText: 'Aniruddha Tewari', imageHint: 'products', isVisible: true },
            { id: 'spotlight-dummy-2', imageUrl: '/images/products/chana-sattu-roasted-bengal-gram-flour/image_1.png', linkUrl: '/collections/summer-sattu-cooling-collection', name: 'Roasted Chana Sattu', description: 'I have been drinking this sattu drink daily after morning yoga - clean plant protein and cooling energy without any bloat. A daily staple.', buttonText: 'Ajinkya R', imageHint: 'bestseller', isVisible: true },
            { id: 'spotlight-dummy-3', imageUrl: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png', linkUrl: '/collections/wholesome-atta', name: 'Browntop Millet Atta', description: 'The highest natural prebiotic fiber grain for optimum gut microbiome balance and long-lasting energy.', buttonText: 'Explore Atta', imageHint: 'millet', isVisible: true },
        ];
    }

    // Derive wave accent colors from theme gradient
    const getWaveColors = () => {
        const g = settings.theme_gradient || '';
        if (g.includes('#cbebff') || g.includes('#f0f9ff')) return { c1: '#3b82f6', c2: '#60a5fa', c3: '#2563eb' }; // Blue
        if (g.includes('#fff1f2') || g.includes('#fce7f3')) return { c1: '#ec4899', c2: '#f472b6', c3: '#db2777' }; // Pink
        if (g.includes('#fffbeb') || g.includes('#fef3c7')) return { c1: '#f59e0b', c2: '#fbbf24', c3: '#d97706' }; // Gold
        if (g.includes('#f9fafb') || g.includes('#f3f4f6')) return { c1: '#6b7280', c2: '#9ca3af', c3: '#4b5563' }; // Gray
        if (g.includes('#faf5ff') || g.includes('#f3e8ff')) return { c1: '#8b5cf6', c2: '#a78bfa', c3: '#7c3aed' }; // Purple
        return { c1: '#10b981', c2: '#34d399', c3: '#059669' }; // Default green
    };
    const wc = getWaveColors();

    return (
        <section
            className="relative py-8 md:py-12 overflow-hidden"
            style={{ backgroundImage: sectionBg }}
        >

            {/* Top Wave - Theme Aware */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-[1]">
                <svg
                    className="relative block w-full h-[40px] md:h-[60px]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 120"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="waveGradientTop" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={wc.c1} stopOpacity="0.15" />
                            <stop offset="50%" stopColor={wc.c2} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={wc.c3} stopOpacity="0.15" />
                        </linearGradient>
                        <linearGradient id="waveGradientTop2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={wc.c3} stopOpacity="0.08" />
                            <stop offset="50%" stopColor={wc.c2} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={wc.c1} stopOpacity="0.08" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,0 L0,0 Z"
                        fill="url(#waveGradientTop)"
                    />
                    <path
                        d="M0,60 C360,100 720,20 1080,60 C1260,80 1360,50 1440,60 L1440,0 L0,0 Z"
                        fill="url(#waveGradientTop2)"
                    />
                </svg>
            </div>

            {/* Subtle Radial Glow Behind Content - Theme Aware */}
            <div
                className="absolute inset-0 z-[0] pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 60% 40% at 50% 50%, color-mix(in srgb, ${wc.c2} 6%, transparent) 0%, transparent 70%)`,
                }}
            />

            <div className="container relative z-10 mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <GradientHeading
                        text="Spotlight"
                        icon="Star"
                        variant="left"
                        size="lg"
                        className="mb-0"
                    />
                    <div className="flex -space-x-1">
                        <Star className="w-4 h-4 md:w-6 md:h-6 text-[#FFC857] fill-[#FFC857] rotate-[-15deg]" />
                        <Star className="w-6 h-6 md:w-8 md:h-8 text-[#FFC857] fill-[#FFC857] -mt-2" />
                        <Star className="w-3 h-3 md:w-5 md:h-5 text-[#FFC857] fill-[#FFC857] rotate-[15deg]" />
                    </div>
                </div>

                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {slides.map((slide, index) => (
                            <CarouselItem key={slide.id} className="pl-4 md:basis-1/2 lg:basis-[45%] xl:basis-[40%]">
                                <Link
                                    href={slide.linkUrl || '#'}
                                    className="group block h-full select-none"
                                >
                                    <div className="flex h-[300px] md:h-[350px] gap-4">
                                        {/* Image Card */}
                                        <div className="w-[45%] md:w-1/2 relative h-full rounded-[2rem] overflow-hidden shadow-sm bg-gray-100">
                                            <Image
                                                src={slide.imageUrl}
                                                alt={slide.name || 'Millet Yard Customer Favorite - Authentic Shree Anna Superfoods'}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                placeholder="blur"
                                                blurDataURL={BLUR_DATA_URL}
                                            />
                                        </div>

                                        {/* Content Card */}
                                        <div className="w-[55%] md:w-1/2 bg-[#5d4037] text-white p-6 md:p-8 rounded-[2rem] flex flex-col justify-center items-center text-center shadow-lg h-full">
                                            <h3 className="font-bold text-lg md:text-xl mb-4 leading-tight">
                                                {slide.name}
                                            </h3>

                                            {slide.description && (
                                                <p className="text-white/90 text-xs md:text-sm font-light leading-relaxed mb-6">
                                                    "{slide.description}"
                                                </p>
                                            )}

                                            {/* Author */}
                                            <span className="mt-auto text-sm font-medium text-amber-100/80">
                                                {slide.buttonText || 'Featured'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Navigation Arrows */}
                    <div className="hidden md:block">
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 border-none bg-transparent hover:bg-transparent text-gray-400 hover:text-gray-800" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-10 w-10 border-none bg-transparent hover:bg-transparent text-gray-400 hover:text-gray-800" />
                    </div>
                </Carousel>
            </div>

            {/* Bottom Wave - Theme Aware */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-[1] rotate-180">
                <svg
                    className="relative block w-full h-[40px] md:h-[60px]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 120"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="waveGradientBottom" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={wc.c3} stopOpacity="0.15" />
                            <stop offset="50%" stopColor={wc.c2} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={wc.c1} stopOpacity="0.15" />
                        </linearGradient>
                        <linearGradient id="waveGradientBottom2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={wc.c1} stopOpacity="0.08" />
                            <stop offset="50%" stopColor={wc.c2} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={wc.c3} stopOpacity="0.08" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,0 L0,0 Z"
                        fill="url(#waveGradientBottom)"
                    />
                    <path
                        d="M0,60 C360,100 720,20 1080,60 C1260,80 1360,50 1440,60 L1440,0 L0,0 Z"
                        fill="url(#waveGradientBottom2)"
                    />
                </svg>
            </div>
        </section>
    );
}
