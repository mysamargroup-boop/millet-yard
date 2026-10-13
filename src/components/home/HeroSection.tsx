
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BLUR_DATA_URL } from '@/lib/constants';
import type { SiteImage, SiteSettings } from '@/lib/types';

interface HeroSectionProps {
    siteImages: SiteImage[];
    settings: SiteSettings;
}

export default function HeroSection({ siteImages, settings }: HeroSectionProps) {
    // Get hero image from site_images
    const heroImage = siteImages.find(img => img.id === 'hero-desktop');

    if (!heroImage || !heroImage.imageUrl) return null;

    return (
        <section className="hidden md:block relative w-full h-[500px] lg:h-[600px] overflow-hidden">
            {/* Background Image */}
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.name || 'Millet Yard 100% Pure Unpolished Shree Anna Millets & Superfoods'}
                fill
                className="object-cover"
                priority
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-xl text-white">
                        <h1 className="text-4xl lg:text-6xl font-headline font-bold leading-tight mb-4">
                            {heroImage.name || '100% Pure & Unpolished Shree Anna Millets'}
                        </h1>
                        <p className="text-lg lg:text-xl text-white/80 mb-6">
                            {heroImage.description || 'Cold stone-ground flours, traditional grains & authentic superfoods straight from Indian farms.'}
                        </p>
                        <div className="flex gap-4">
                            <Button size="lg" className="bg-primary hover:bg-primary/90">
                                <Link href="/shop">Shop Now</Link>
                            </Button>
                            <Button size="lg" variant="ghost" className="border border-white text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300">
                                <Link href="/collections/superfood-combos">Superfood Combos</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
