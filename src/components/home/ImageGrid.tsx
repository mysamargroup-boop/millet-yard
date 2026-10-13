
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import { useEffect, useState } from 'react';
import type { SiteImage } from '@/lib/types';

const defaultCategories = [
    {
        name: 'Unpolished Millets',
        href: '/collections/millets',
        image: { imageUrl: '/images/products/barnyard-millet-shreeanna-500-gram/image_1.png', imageHint: 'unpolished millets' },
    },
    {
        name: 'Wholesome Atta',
        href: '/collections/flour',
        image: { imageUrl: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png', imageHint: 'millet flour' },
    },
    {
        name: 'Superfood Combos',
        href: '/collections/combos',
        image: { imageUrl: '/images/products/daily-essential-combo-jowar-ragi-amp-bajra-flour-500g-each/image_1.png', imageHint: 'millet combo' },
    },
    {
        name: 'Idli & Dosa Rawa',
        href: '/collections/rava',
        image: { imageUrl: '/images/products/jowar-idli-rawa/image_1.png', imageHint: 'millet rawa' },
    },
    {
        name: 'Traditional Pickles',
        href: '/collections/pickles',
        image: { imageUrl: '/images/products/millet-yard-premium-traditional-aam-ka-achaar-mango-pickle-authentic-indian-homemade-style-mango-pickle-1-kg/image_1.png', imageHint: 'aam ka achaar' },
    },
    {
        name: 'Nutritious Laddoos',
        href: '/collections/snacks',
        image: { imageUrl: '/images/products/nutritious-ragi-laddoo/image_1.png', imageHint: 'ragi laddoo' },
    },
    {
        name: 'Flakes & Daliya',
        href: '/collections/daliya',
        image: { imageUrl: '/images/products/jowar-daliya/image_1.png', imageHint: 'jowar daliya' },
    },
    {
        name: 'Explore All',
        href: '/shop',
        image: { imageUrl: '/images/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour/image_1.png', imageHint: 'all products' },
    },
];

interface ImageGridProps {
    siteImages: SiteImage[];
}

export default function ImageGrid({ siteImages }: ImageGridProps) {
    const [giftCategories, setGiftCategories] = useState(defaultCategories);

    useEffect(() => {
        const categoryIds = [
            'grid-millets', 'grid-flour', 'grid-combos', 'grid-rava',
            'grid-pickles', 'grid-snacks', 'grid-daliya', 'grid-all'
        ];

        const hrefMap: { [key: string]: string } = {
            'grid-millets': '/collections/millets',
            'grid-flour': '/collections/flour',
            'grid-combos': '/collections/combos',
            'grid-rava': '/collections/rava',
            'grid-pickles': '/collections/pickles',
            'grid-snacks': '/collections/snacks',
            'grid-daliya': '/collections/daliya',
            'grid-all': '/shop',
        };

        const updatedCategories = defaultCategories.map((def, idx) => {
            const id = categoryIds[idx];
            const imgData = siteImages.find(img => img.id === id);
            return {
                name: imgData?.name || def.name,
                href: hrefMap[id] || def.href,
                image: imgData || def.image,
            };
        });

        setGiftCategories(updatedCategories);

    }, [siteImages]);


    return (
        <section className="container mx-auto px-4 pt-6 pb-2 md:pt-12 lg:pt-14 md:pb-4 bg-transparent">
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-4 md:gap-x-4 md:gap-y-6">
                {giftCategories.map(category => (
                    <Link key={category.name} href={category.href} className="text-center group flex flex-col items-center">
                        {/* Changed rounded-full to rounded-xl for square shape with slight curve */}
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 shadow-sm transition-shadow duration-300 group-hover:shadow-md border-2 border-orange-50 group-hover:border-orange-100">
                            <Image
                                src={category.image.imageUrl}
                                alt={category.name}
                                fill
                                sizes="(max-width: 768px) 25vw, 15vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-stone-700 group-hover:text-primary transition-colors line-clamp-1 uppercase tracking-tight">
                            {category.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
