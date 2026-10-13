'use client';

import { Product } from '@/lib/types';
import { isVideoUrl, cn } from '@/lib/utils';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import GradientHeading from '@/components/ui/GradientHeading';

interface ProductMediaGridProps {
    product: Product;
}

const MediaItem = ({ url, className }: { url: string; className?: string }) => {
    if (!url) return null;
    const isVideo = isVideoUrl(url);

    return (
        <div className={`relative overflow-hidden rounded-xl bg-gray-100 ${className}`}>
            {isVideo ? (
                <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    loop
                    playsInline
                />
            ) : (
                <Image
                    src={url}
                    alt="Product details"
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            )}
        </div>
    );
};

export default function ProductMediaGrid({ product }: ProductMediaGridProps) {
    const media1 = product.media_url_1;
    const media2 = product.media_url_2;
    const media3 = product.media_url_3;

    const items = [media1, media2, media3].filter(Boolean) as string[];
    if (items.length === 0) return null;

    return (
        <div className="my-12">
            <GradientHeading text="Closer Look" className="mb-8" underlineClassName="mx-auto" />

            <div className={cn(
                "grid gap-4",
                items.length === 1 && "grid-cols-1 max-w-3xl mx-auto h-[350px] md:h-[450px]",
                items.length === 2 && "grid-cols-1 md:grid-cols-2 h-auto md:h-[420px]",
                items.length >= 3 && "grid-cols-1 md:grid-cols-4 h-auto md:h-[500px]"
            )}>
                {items.length === 1 && (
                    <MediaItem url={items[0]} className="h-full" />
                )}
                {items.length === 2 && (
                    <>
                        <MediaItem url={items[0]} className="h-[300px] md:h-full" />
                        <MediaItem url={items[1]} className="h-[300px] md:h-full" />
                    </>
                )}
                {items.length >= 3 && (
                    <>
                        <MediaItem url={items[0]} className="md:col-span-2 h-[300px] md:h-full" />
                        <MediaItem url={items[1]} className="md:col-span-1 h-[300px] md:h-full" />
                        <MediaItem url={items[2]} className="md:col-span-1 h-[300px] md:h-full" />
                    </>
                )}
            </div>
        </div>
    );
}
