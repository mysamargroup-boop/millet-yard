'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Play, Eye, Package } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import GradientHeading from "@/components/ui/GradientHeading";
import { Video } from "lucide-react";

const PLACEHOLDER_VIDEOS = [
    {
        id: 'v1',
        type: 'Artisan Workshop',
        thumbnail_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
    },
    {
        id: 'v2',
        type: 'Customer Unboxing',
        thumbnail_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
    },
    {
        id: 'v3',
        type: 'Product Highlight',
        thumbnail_url: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=800&q=80',
    },
    {
        id: 'v4',
        type: 'Artisan Finishing',
        thumbnail_url: 'https://images.unsplash.com/photo-1544061807-68b698bb2f9b?w=800&q=80',
    },
    {
        id: 'v5',
        type: 'Premium Packaging',
        thumbnail_url: 'https://images.unsplash.com/photo-1513201099747-3658bf603716?w=800&q=80',
    }
];

// For demo purposes, generating random view counts
const getRandomViews = () => {
    const views = (Math.random() * 10 + 1).toFixed(1);
    return `${views}K`;
}

const getRandomProducts = () => {
    return Math.floor(Math.random() * 8) + 1;
}

interface VideoGalleryProps {
    videos: any[];
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }

        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const displayVideos = videos && videos.length > 0 ? videos : PLACEHOLDER_VIDEOS;

    if (!displayVideos || displayVideos.length === 0) return null;

    return (
        <section className="py-8 md:py-12 bg-transparent relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <GradientHeading
                    text="Watch & Shop"
                    icon="Video"
                    subtitle="Experience our products in action through these short clips."
                    variant="left"
                    size="lg"
                />

                <div className="relative">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "center",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 1500,
                                stopOnInteraction: false,
                                stopOnMouseEnter: false,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-6 items-center py-10 overflow-visible">
                            {displayVideos.map((video, index) => {
                                const isActive = index === current;
                                return (
                                    <CarouselItem key={video.id} className="basis-[50%] md:basis-[25%] lg:basis-[20%] pl-6 transition-all duration-500 ease-out">
                                        <div className={`transform transition-all duration-500 ease-out ${isActive ? 'scale-105 z-10 opacity-100 blur-0' : 'scale-95 opacity-50 blur-[1px]'}`}>
                                            <Card className="rounded-2xl overflow-hidden border-0 shadow-xl aspect-[9/16] relative group cursor-pointer">
                                                <CardContent className="p-0 h-full relative">
                                                    {video.thumbnail_url ? (
                                                        <Image
                                                            src={video.thumbnail_url}
                                                            alt={video.type || 'Video'}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-900" />
                                                    )}

                                                    {/* Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                                                    {/* Play Icon - Centered */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                                                            <Play className="h-8 w-8 text-white fill-white" />
                                                        </div>
                                                    </div>

                                                    {/* Top Right - View Count Badge */}
                                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-white border border-white/10 shadow-lg">
                                                        <Eye className="h-3 w-3 text-white" />
                                                        <span className="text-[10px] font-medium">{getRandomViews()}</span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug mb-2 drop-shadow-md capitalize">
                                                            {video.type || 'Video'}
                                                        </h3>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </CarouselItem>
                                )
                            })}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex left-4 bg-white/10 backdrop-blur-md hover:bg-white/20 border-0 text-white" />
                        <CarouselNext className="hidden md:flex right-4 bg-white/10 backdrop-blur-md hover:bg-white/20 border-0 text-white" />
                    </Carousel>
                </div>
            </div>
        </section>
    );
}
