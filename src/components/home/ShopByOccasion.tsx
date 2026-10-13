
"use client";

import { useState } from 'react';
import { Heart } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import GradientHeading from '@/components/ui/GradientHeading';

const HEALTH_GOAL_TAGS = [
  'All Superfoods',
  'Diabetic Friendly',
  'Gluten Free',
  'High Fibre & Gut Health',
  'Weight Management',
  'Calcium & Bone Health'
];

const ShopByOccasion = ({ products, tags }: { products: Product[], tags: string[] }) => {
  // Don't render if no products exist
  if (!products || products.length === 0) {
    return null;
  }

  const [selectedTag, setSelectedTag] = useState('All Superfoods');

  const filteredProducts = products.filter(p => {
    if (selectedTag === 'All Superfoods') return true;
    const searchIn = `${p.name} ${p.category} ${(p.tags || []).join(' ')} ${p.description || ''} ${p.specificDescription || ''}`.toLowerCase();
    if (selectedTag === 'Diabetic Friendly') {
      return searchIn.includes('diabet') || searchIn.includes('sugar') || searchIn.includes('browntop') || searchIn.includes('barnyard') || searchIn.includes('low gi');
    }
    if (selectedTag === 'Gluten Free') {
      return searchIn.includes('gluten') || searchIn.includes('jowar') || searchIn.includes('ragi') || searchIn.includes('bajra') || searchIn.includes('millet');
    }
    if (selectedTag === 'High Fibre & Gut Health') {
      return searchIn.includes('gut') || searchIn.includes('fibre') || searchIn.includes('fiber') || searchIn.includes('digestion') || searchIn.includes('browntop');
    }
    if (selectedTag === 'Weight Management') {
      return searchIn.includes('weight') || searchIn.includes('sattu') || searchIn.includes('kodo') || searchIn.includes('foxtail');
    }
    if (selectedTag === 'Calcium & Bone Health') {
      return searchIn.includes('ragi') || searchIn.includes('calcium') || searchIn.includes('bone') || searchIn.includes('laddoo');
    }
    return true;
  });

  return (
    <section className="py-8 md:py-12 bg-transparent relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <GradientHeading
          text="Shop By Health Goal"
          icon="Heart"
          subtitle="Doctor & nutritionist approved Shree Anna millets tailored for your daily health needs"
          variant="left"
          size="lg"
        />

        <div className="flex justify-start gap-2 mb-8 flex-wrap">
          {HEALTH_GOAL_TAGS.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "rounded-full transition-all duration-300 text-xs md:text-sm font-semibold",
                selectedTag === tag
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-md scale-105'
                  : 'bg-emerald-50/50 border-emerald-200 text-foreground hover:bg-emerald-100 hover:border-emerald-300'
              )}
            >
              {tag}
            </Button>
          ))}
        </div>

        {filteredProducts.length > 0 ? (
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-0.5 md:-ml-4">
              {filteredProducts.map((product) => (
                <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-0.5 md:pl-4">
                  <div className="p-0.5 h-full">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-6 bg-background/80 backdrop-blur-sm border-2 shadow-none" />
            <CarouselNext className="hidden sm:flex -right-4 lg:-right-6 bg-background/80 backdrop-blur-sm border-2 shadow-none" />
          </Carousel>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No products found for this occasion.
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopByOccasion;
