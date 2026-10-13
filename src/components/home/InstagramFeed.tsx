"use client";

import Image from 'next/image';
import { Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BLUR_DATA_URL } from '@/lib/constants';
import type { SiteImage } from '@/lib/types';
import GradientHeading from '@/components/ui/GradientHeading';

import { SiteSettings } from '@/lib/types';

interface InstagramFeedProps {
    siteImages: SiteImage[];
    settings?: SiteSettings;
}

export default function InstagramFeed({ siteImages, settings }: InstagramFeedProps) {
    // Extract handle from settings or default
    const instagramUrl = settings?.social_instagram || 'https://instagram.com/milletyard';
    const handle = instagramUrl.split('/').pop() || 'milletyard';
    const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;

    // Filter for IDs starting with 'instagram-'
    let posts = siteImages
        .filter(img => img.id.startsWith('instagram-') && img.isVisible !== false)
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 6); // Limit to 6 posts

    // Authentic Millet Yard Reels / Food Fallback
    if (posts.length === 0) {
        posts = [
            { id: 'insta-m-1', imageUrl: '/images/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour/image_1.png', linkUrl: 'https://instagram.com/milletyard', description: 'Freshly milled Barnyard Atta Roti', imageHint: 'food', isVisible: true },
            { id: 'insta-m-2', imageUrl: '/images/products/jowar-idli-rawa/image_1.png', linkUrl: 'https://instagram.com/milletyard', description: 'Soft & Fluffy Jowar Idli', imageHint: 'recipe', isVisible: true },
            { id: 'insta-m-3', imageUrl: '/images/products/nutritious-ragi-laddoo/image_1.png', linkUrl: 'https://instagram.com/milletyard', description: 'Traditional Bilona Ghee Ragi Laddoo', imageHint: 'healthy-snack', isVisible: true },
            { id: 'insta-m-4', imageUrl: '/images/products/millet-yard-premium-traditional-aam-ka-achaar-mango-pickle-authentic-indian-homemade-style-mango-pickle-1-kg/image_1.png', linkUrl: 'https://instagram.com/milletyard', description: 'Sun-drenched Mustard Oil Aam Ka Achaar', imageHint: 'pickle', isVisible: true },
            { id: 'insta-m-5', imageUrl: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png', linkUrl: 'https://instagram.com/milletyard', description: 'High-fibre Siridhanya Browntop Flour', imageHint: 'atta', isVisible: true },
            { id: 'insta-m-6', imageUrl: '/images/products/daily-essential-combo-jowar-ragi-amp-bajra-flour-500g-each/image_1.png', linkUrl: 'https://instagram.com/milletyard', description: 'Daily Fortify Superfood Millets', imageHint: 'combo', isVisible: true },
        ];
    }

    return (
        <section className="py-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="text-left mb-8">
                    <GradientHeading
                        text="Follow @milletyard on Instagram"
                        icon="Instagram"
                        subtitle="Join our community of 10,000+ healthy eaters. Watch recipes, farmer stories & reels!"
                        variant="left"
                        size="lg"
                    />
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100/50 text-pink-600 text-sm font-semibold">
                        <Instagram className="w-4 h-4" />
                        <span>{displayHandle}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            href={post.linkUrl || instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                        >
                            <Image
                                src={post.imageUrl}
                                alt={post.description || post.name || "Millet Yard Instagram Recipe Reel"}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Instagram className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <Button asChild size="default" className="rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 px-6 py-2 h-auto">
                        <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-base font-semibold">
                            <Instagram className="w-5 h-5" />
                            Follow @milletyard On Instagram
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
