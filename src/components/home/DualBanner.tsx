"use client";

import Image from 'next/image';
import Link from 'next/link';
import { BLUR_DATA_URL } from '@/lib/constants';
import type { SiteImage } from '@/lib/types';

interface DualBannerProps {
    siteImages: SiteImage[];
}

export default function DualBanner({ siteImages }: DualBannerProps) {
    let banner1 = siteImages.find(img => img.id === 'dual-banner-1');
    let banner2 = siteImages.find(img => img.id === 'dual-banner-2');

    // Millet Yard Authentic Fallback
    if (!banner1 && !banner2) {
        banner1 = { id: 'dual-banner-dummy-1', imageUrl: '/images/products/barnyard-millet-shreeanna-500-gram/image_1.png', name: 'Farm-Fresh Shree Anna Millets', description: '100% Unpolished & whole grain nutrition direct from trusted tribal farmers', imageHint: 'millet grains', buttonText: 'Shop Grains', linkUrl: '/collections/millets', isVisible: true };
        banner2 = { id: 'dual-banner-dummy-2', imageUrl: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png', name: 'Stone-Ground Wholesome Atta', description: 'Slow-milled diabetic-friendly flours packed with dietary fibre & iron', imageHint: 'millet atta', buttonText: 'Explore Flours', linkUrl: '/collections/flour', isVisible: true };
    }

    return (
        <section className="py-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Banner 1 */}
                    {banner1 && (
                        <Link
                            href={banner1.linkUrl || '/shop'}
                            className="group relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all duration-500"
                        >
                            <Image
                                src={banner1.imageUrl}
                                alt={banner1.name || 'Millet Yard 100% Unpolished Shree Anna Superfoods'}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                sizes="50vw"
                            />
                            {/* Attractive overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                            <div className="absolute inset-0 ring-2 ring-white/20 rounded-2xl group-hover:ring-white/40 transition-all duration-500" />
                            {banner1.name && (
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-white font-bold text-sm md:text-xl drop-shadow-lg">{banner1.name}</h3>
                                    {banner1.description && (
                                        <p className="text-white/80 text-xs md:text-sm mt-1 line-clamp-2">{banner1.description}</p>
                                    )}
                                    {banner1.buttonText && (
                                        <span className="inline-block mt-2 text-xs md:text-sm font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 group-hover:bg-white/30 transition-colors">
                                            {banner1.buttonText}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>
                    )}

                    {/* Banner 2 */}
                    {banner2 && (
                        <Link
                            href={banner2.linkUrl || '/shop'}
                            className="group relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all duration-500"
                        >
                            <Image
                                src={banner2.imageUrl}
                                alt={banner2.name || 'Millet Yard Stone-Ground Flours & Wholesome Millets'}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                sizes="50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                            <div className="absolute inset-0 ring-2 ring-white/20 rounded-2xl group-hover:ring-white/40 transition-all duration-500" />
                            {banner2.name && (
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-white font-bold text-sm md:text-xl drop-shadow-lg">{banner2.name}</h3>
                                    {banner2.description && (
                                        <p className="text-white/80 text-xs md:text-sm mt-1 line-clamp-2">{banner2.description}</p>
                                    )}
                                    {banner2.buttonText && (
                                        <span className="inline-block mt-2 text-xs md:text-sm font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 group-hover:bg-white/30 transition-colors">
                                            {banner2.buttonText}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
