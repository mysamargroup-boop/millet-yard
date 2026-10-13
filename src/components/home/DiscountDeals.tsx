'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BLUR_DATA_URL } from '@/lib/constants';
import GradientHeading from '@/components/ui/GradientHeading';
import { Flame } from 'lucide-react';

interface DiscountDeal {
    id: string;
    title: string;
    discount: string;
    imageUrl: string;
    linkUrl: string;
    bgColor: string;
}

/**
 * ============================================================
 *  HOW TO CHANGE DISCOUNT DEALS IMAGES & DATA
 * ============================================================
 * 
 * Each deal object below has these fields:
 *   - id:        Unique identifier (string)
 *   - title:     Category/deal name displayed on hover
 *   - discount:  Discount text shown on the card (e.g. "Upto 70% OFF")
 *   - imageUrl:  Background image URL for the card
 *                → Replace this URL with your own product image
 *                → Recommended: 400x600px, high quality, JPG/WebP
 *                → You can use Unsplash, Cloudinary, or any CDN URL
 *   - linkUrl:   Where the card links to when clicked
 *   - bgColor:   Gradient overlay colors (Tailwind CSS classes)
 *                → Format: 'from-{color} to-{color}'
 *                → Example: 'from-yellow-400 to-amber-500'
 * 
 * To add a new deal: Copy any existing object and modify the fields.
 * To remove a deal: Delete the entire { ... } object.
 * To change order: Rearrange the objects in the array.
 * ============================================================
 */
const discountDeals: DiscountDeal[] = [
    {
        id: '1',
        title: 'Unpolished Millets',
        discount: 'Upto 25% OFF',
        imageUrl: '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
        linkUrl: '/collections/unpolished-millets',
        bgColor: 'from-amber-500 to-yellow-600',
    },
    {
        id: '2',
        title: 'Stone-Ground Atta',
        discount: 'Upto 20% OFF',
        imageUrl: '/images/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour/image_1.png',
        linkUrl: '/collections/wholesome-atta',
        bgColor: 'from-emerald-500 to-teal-600',
    },
    {
        id: '3',
        title: 'Superfood Combos',
        discount: 'Upto 35% OFF',
        imageUrl: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png',
        linkUrl: '/collections/superfood-combos',
        bgColor: 'from-orange-500 to-amber-600',
    },
    {
        id: '4',
        title: 'Idli & Dosa Rawa',
        discount: 'Upto 20% OFF',
        imageUrl: '/images/products/copy-of-kodo-millet-shreeanna-500-gram/image_1.png',
        linkUrl: '/collections/idli-dosa-rawa',
        bgColor: 'from-amber-600 to-orange-700',
    },
    {
        id: '5',
        title: 'Summer Cooling Sattu',
        discount: 'Upto 30% OFF',
        imageUrl: '/images/products/chana-sattu-roasted-bengal-gram-flour/image_1.png',
        linkUrl: '/collections/summer-sattu-cooling-collection',
        bgColor: 'from-yellow-500 to-amber-600',
    },
    {
        id: '6',
        title: 'Nutritious Laddoos',
        discount: 'Upto 25% OFF',
        imageUrl: '/images/products/nutritious-ragi-laddoo/image_1.png',
        linkUrl: '/collections/nutritious-laddoos',
        bgColor: 'from-rose-500 to-pink-600',
    },
    {
        id: '7',
        title: 'Flakes & Daliya',
        discount: 'Upto 15% OFF',
        imageUrl: '/images/products/chana-jau-sattu-roasted-bengal-gram-barley-flour-high-protein-high-fiber-100-natural/image_1.png',
        linkUrl: '/collections/flakes-daliya',
        bgColor: 'from-teal-500 to-emerald-600',
    },
    {
        id: '8',
        title: 'Artisanal Pickles',
        discount: 'Upto 20% OFF',
        imageUrl: '/images/products/millet-yard-premium-traditional-aam-ka-achaar-mango-pickle-authentic-indian-homemade-style-mango-pickle-1-kg/image_1.png',
        linkUrl: '/collections/traditional-pickles',
        bgColor: 'from-red-500 to-orange-600',
    },
];

export default function DiscountDeals() {
    return (
        <section className="py-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <GradientHeading
                    text="Discount Deals"
                    icon="Flame"
                    subtitle="Grab your favorites at unbeatable prices before they're gone"
                    variant="left"
                    size="lg"
                />

                {/* 3 columns mobile, 4 columns desktop */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                    {discountDeals.map((deal) => (
                        <Link
                            key={deal.id}
                            href={deal.linkUrl}
                            className="group relative overflow-hidden rounded-xl md:rounded-2xl aspect-[3/4] md:aspect-[3/4]"
                        >
                            {/* Background Image */}
                            <Image
                                src={deal.imageUrl}
                                alt={deal.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                sizes="(max-width: 768px) 33vw, 25vw"
                            />

                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t ${deal.bgColor} opacity-70 group-hover:opacity-80 transition-opacity`} />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 text-center">
                                <span className="text-lg md:text-3xl font-extrabold drop-shadow-lg">
                                    {deal.discount}
                                </span>
                                <span className="text-[9px] md:text-xs mt-2 opacity-90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Shop Now →
                                </span>
                            </div>

                            {/* Hover Effect Ring */}
                            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-xl md:rounded-2xl transition-all duration-300" />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
