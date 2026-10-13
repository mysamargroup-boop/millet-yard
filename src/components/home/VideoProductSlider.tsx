"use client";

import { useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Product } from '@/lib/types';
import { isVideoUrl } from '@/lib/utils';
import Link from 'next/link';
import { Video, Play, ArrowRight } from 'lucide-react';
import GradientHeading from '@/components/ui/GradientHeading';
import Image from 'next/image';

const PLACEHOLDER_VIDEO_PRODUCTS: Product[] = [
    {
        id: 'vp1',
        name: 'Traditional Stone-Chakki Milling',
        price: 0,
        regularPrice: 0,
        salePrice: 0,
        imageUrl: '/images/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour/image_1.png',
        category: 'wholesome-atta',
        badge: '100% Cold Stone Milled',
        rating: 5,
        reviewCount: 120,
        description: 'Slow-speed cold stone grinding preserving living wheat-germ, natural prebiotic fibers, and minerals under 40°C.',
        features: ['100% Stone Ground', 'Cold Processed', 'Zero Preservatives'],
        inventory: 1
    },
    {
        id: 'vp2',
        name: 'Native Solar Farm Harvest',
        price: 0,
        regularPrice: 0,
        salePrice: 0,
        imageUrl: '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
        category: 'unpolished-millets',
        badge: 'Direct Farm Sourced',
        rating: 5,
        reviewCount: 88,
        description: 'Naturally grown drought-hardy Shree Anna grains harvested and solar-dried by smallholder Indian farmers.',
        features: ['Chemical-Free', '100% Unpolished', 'Single-Origin'],
        inventory: 1
    },
    {
        id: 'vp3',
        name: 'Artisanal Bilona Ghee Laddoos',
        price: 0,
        regularPrice: 0,
        salePrice: 0,
        imageUrl: '/images/products/nutritious-ragi-laddoo/image_1.png',
        category: 'nutritious-laddoos',
        badge: 'A2 Bilona Ghee Craft',
        rating: 5,
        reviewCount: 145,
        description: 'Handcrafted Ragi & Jowar superfood laddoos prepared with authentic Bilona cow ghee and unrefined organic jaggery.',
        features: ['Bilona Cow Ghee', 'Organic Jaggery', 'Rich in Calcium'],
        inventory: 1
    },
    {
        id: 'vp4',
        name: 'Heritage Sand-Roasted Sattu',
        price: 0,
        regularPrice: 0,
        salePrice: 0,
        imageUrl: '/images/products/chana-sattu-roasted-bengal-gram-flour/image_1.png',
        category: 'summer-sattu-cooling-collection',
        badge: 'Vedic Cooling Superfood',
        rating: 5,
        reviewCount: 92,
        description: 'Sand-roasted Bengal gram and barley flour, stone-ground for instantaneous cooling hydration and 20g+ natural protein.',
        features: ['High Plant Protein', 'Instant Digestion', 'Cooling Gut Health'],
        inventory: 1
    }
];

export default function VideoProductSlider({ products }: { products: Product[] }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });

    // Filter products: Must have "Bestseller" (case-insensitive) in badge AND be a video URL
    const videoProducts = products.filter(p =>
        p.badge &&
        p.badge.toLowerCase().includes('bestseller') &&
        isVideoUrl(p.imageUrl)
    );

    const isPlaceholder = videoProducts.length === 0;
    const displayProducts = isPlaceholder ? PLACEHOLDER_VIDEO_PRODUCTS : videoProducts;

    const playActiveVideo = useCallback(() => {
        if (!emblaApi) return;
        const scrollSnap = emblaApi.selectedScrollSnap();
        const slideNodes = emblaApi.slideNodes();

        // Pause all
        const allVideos = emblaApi.rootNode().querySelectorAll('video');
        allVideos.forEach(v => v.pause());

        // Play active
        const activeSlide = slideNodes[scrollSnap];
        if (activeSlide) {
            const video = activeSlide.querySelector('video');
            if (video) {
                video.play().catch(e => { /* Auto-play prevented silently */ });
            }
        }
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', playActiveVideo);
        emblaApi.on('reInit', playActiveVideo);
        const timer = setTimeout(playActiveVideo, 500);
        return () => clearTimeout(timer);
    }, [emblaApi, playActiveVideo]);

    if (displayProducts.length === 0) return null;

    return (
        <section className="relative py-8 md:py-12 overflow-hidden bg-transparent">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/15 rounded-full blur-3xl opacity-40" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-3xl opacity-60" />
            </div>

            <div className="container mx-auto px-4 mb-8 text-left relative z-10">
                <GradientHeading
                    text="Traditional Milling & Farm Stories"
                    icon="Video"
                    subtitle="Witness stone-ground milling, traditional sun-drying, and authentic native farm sourcing"
                    variant="left"
                    size="lg"
                />
            </div>

            <div className="max-w-[1400px] mx-auto px-4 overflow-visible" ref={emblaRef}>
                <div className="flex touch-pan-y -ml-4 md:-ml-8 items-center">
                    {displayProducts.map((product) => (
                        <div className="flex-[0_0_85%] md:flex-[0_0_50%] lg:flex-[0_0_35%] min-w-0 pl-4 md:pl-8 py-8 transition-opacity duration-300" key={product.id}>
                            <div className="group relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden bg-white shadow-2xl shadow-black/10 hover:shadow-3xl hover:shadow-black/20 transition-all duration-500 transform hover:-translate-y-2">
                                {/* Video or Image Render */}
                                {isVideoUrl(product.imageUrl) ? (
                                    <video
                                        src={product.imageUrl}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        muted
                                        loop
                                        playsInline
                                        poster={product.imageUrl.replace('.mp4', '.jpg')}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-emerald-950/20">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            sizes="(max-width: 768px) 85vw, 35vw"
                                        />
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

                                {/* Play / Grain Icon */}
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Play className="w-5 h-5 text-white fill-current" />
                                </div>

                                {/* Content Card */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                            {product.badge || 'Farm Story'}
                                        </span>
                                    </div>
                                    <h3 className="font-headline text-2xl font-bold text-white mb-1 drop-shadow-md">{product.name}</h3>

                                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100">
                                        <p className="text-white/90 text-sm mb-4 line-clamp-2 mt-2">{product.description}</p>
                                        <Link
                                            href={product.id.startsWith('vp') ? `/collections/${product.category}` : `/collections/${product.category?.split(',')[0].trim() || 'all'}/${product.id}`}
                                            className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors"
                                        >
                                            {product.id.startsWith('vp') ? 'Explore Collection' : 'View Product'} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
