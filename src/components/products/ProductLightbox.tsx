
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { BLUR_DATA_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { Badge } from '../ui/badge';

interface ProductLightboxProps {
  images: { imageUrl: string; imageHint: string; }[];
  product: Product;
}

const ProductLightbox = ({ images, product }: ProductLightboxProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (lightboxApi) {
      lightboxApi.scrollTo(lightboxStartIndex, true);
      lightboxApi.on("select", () => { })
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      lightboxApi?.off("select", () => { });
    };
  }, [isLightboxOpen, lightboxApi, lightboxStartIndex]);

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setIsLightboxOpen(true);
  };

  const DEFAULT_FALLBACK_IMAGE = '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png';
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (failedUrl: string) => {
    setFailedImages(prev => ({ ...prev, [failedUrl]: true }));
  };

  const getValidImageSrc = (url: string) => {
    if (!url || failedImages[url]) return DEFAULT_FALLBACK_IMAGE;
    return url;
  };

  const allImages = [product.imageUrl, ...(product.galleryImages || [])].filter(img => img && img.trim() !== '');

  // Ensure at least one image exists
  if (allImages.length === 0) {
    allImages.push(DEFAULT_FALLBACK_IMAGE);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-full">
      {allImages.length > 1 && (
        <div className="order-last md:order-first grid grid-cols-4 sm:grid-cols-5 gap-2 md:flex md:flex-col md:w-24 md:min-w-24 md:h-fit">
          {allImages.map((image, index) => (
            <div
              key={index}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm",
                current === index ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent hover:border-gray-200 hover:scale-105"
              )}
              onClick={() => api?.scrollTo(index)}
            >
              <Image
                src={getValidImageSrc(image)}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 100px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                onError={() => handleImageError(image)}
              />
            </div>
          ))}
        </div>
      )}

      <Carousel setApi={setApi} className="rounded-2xl overflow-hidden cursor-pointer w-full md:flex-1 shadow-lg">
        <CarouselContent>
          {allImages.map((image, index) => (
            <CarouselItem key={index} onClick={() => openLightbox(index)}>
              <div className="relative aspect-[31/36] w-full bg-gray-50 rounded-2xl">
                <Image
                  src={getValidImageSrc(image)}
                  alt={product.name}
                  fill
                  className="object-cover rounded-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  data-ai-hint={product.imageHint}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  priority={index === 0}
                  onError={() => handleImageError(image)}
                />
                {product.tags?.includes('Best Seller') && (
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">BESTSELLER</Badge>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {allImages.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 bg-white/80 hover:bg-white rounded-full" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 bg-white/80 hover:bg-white rounded-full" />
          </>
        )}
      </Carousel>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-8 cursor-zoom-out"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative w-full h-full max-w-4xl max-h-screen flex flex-col justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 md:top-4 md:right-4 z-20 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </Button>

            <Carousel setApi={setLightboxApi} opts={{ startIndex: lightboxStartIndex }} className="w-full h-full flex flex-col justify-center">
              <CarouselContent>
                {allImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative w-full h-full aspect-square max-h-[85vh]">
                      <Image
                        src={getValidImageSrc(image)}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        data-ai-hint={product.imageHint}
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        onError={() => handleImageError(image)}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10" />
                </>
              )}
            </Carousel>

            {allImages.length > 1 && (
              <div className="text-center text-white text-sm py-2">
                {lightboxApi?.selectedScrollSnap() ? lightboxApi.selectedScrollSnap() + 1 : lightboxStartIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductLightbox;
