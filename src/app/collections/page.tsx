
import Link from 'next/link';
import Image from 'next/image';
import { getCategories, getSiteImages } from '@/lib/data-async';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/constants';
import SlidingHero from '@/components/home/SlidingHero';

export const revalidate = 600;

export default async function CollectionsPage() {
  const [categories, { placeholderImages }] = await Promise.all([
    getCategories(),
    getSiteImages()
  ]);

  const heroSlides = placeholderImages
    .filter(img => img.id.startsWith('hero-') && img.isVisible !== false)
    .map(img => ({
      id: img.id,
      name: img.name || '',
      description: img.description || '',
      imageUrl: img.imageUrl,
      linkUrl: img.linkUrl || '/shop',
      buttonText: img.buttonText
    }));

  const slidesToUse = heroSlides.length > 0 ? heroSlides : [
    {
      id: 'hero-1',
      name: 'Handcrafted Wooden Gifts',
      description: 'Discover unique handcrafted wooden gifts for every occasion',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1920&q=80',
      linkUrl: '/shop',
      buttonText: 'Shop Now'
    },
    {
      id: 'hero-2',
      name: 'Personalized Creations',
      description: 'Customized wooden art designed specifically for your loved ones',
      imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1920&q=80',
      linkUrl: '/collections/personalized',
      buttonText: 'View Collections'
    },
    {
      id: 'hero-3',
      name: 'Artisan Decor',
      description: 'Bring the warmth of natural wood into your home',
      imageUrl: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=1920&q=80',
      linkUrl: '/shop',
      buttonText: 'Shop Decor'
    }
  ];

  return (
    <div className="min-h-screen">
      <SlidingHero slides={slidesToUse} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold md:text-5xl">Our Collections</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our range of handcrafted wooden gifts, sorted by category.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
        {categories.map((category) => {
          return (
            <Link key={category.id} href={category.linkUrl || `/collections/${category.id}`} className="group block">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-0 relative">
                  <div className="aspect-square relative">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={category.imageHint}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 p-2 md:p-4">
                    <h3 className="text-base md:text-xl font-bold font-headline text-white">{category.name}</h3>
                    <div className="hidden md:flex items-center text-sm font-semibold text-white/90 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>View Products</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
    </div>
  );
}
