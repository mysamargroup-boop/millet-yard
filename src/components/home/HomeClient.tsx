'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/products/ProductCard'
import PromoBanners from '@/components/home/PromoBanners'
import ShopByOccasion from '@/components/home/ShopByOccasion'
import { Input } from '@/components/ui/input'
import { Mic, Search } from 'lucide-react'
import PromoSlider from '@/components/home/PromoSlider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import IconCategoryGrid from '@/components/home/IconCategoryGrid'
import ShopByCategory from '@/components/home/ShopByCategory'
import FeaturedCollections from '@/components/home/FeaturedCollections'
import PopularProducts from '@/components/home/PopularProducts'
import ImageGrid from '@/components/home/ImageGrid'
import TimerBanner from '@/components/home/TimerBanner'
import SlidingCards from '@/components/home/SlidingCards'
import { SiteSettings } from '@/lib/types'
import { TrendingTicker } from "../common/TrendingTicker";
import RainEffect from "../common/RainEffect";
import InstagramFeed from './InstagramFeed';
import Image from 'next/image'
import { BLUR_DATA_URL } from '@/lib/constants'
import RecentlyViewed from '@/components/home/RecentlyViewed'
import DiscountDeals from '@/components/home/DiscountDeals'
import BestSellers from '@/components/home/BestSellers'
import dynamic from 'next/dynamic'

const VideoGallery = dynamic(() => import('@/components/home/VideoGallery'), {
  loading: () => <div className="h-[400px] w-full animate-pulse bg-muted rounded-xl" />
})
const ReviewsCarousel = dynamic(() => import('@/components/products/ReviewsCarousel'), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted rounded-xl" />
})
import {
  getHomeBundle
} from '@/lib/supabase'
import SlidingHero from './SlidingHero'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import BadgeProducts from '@/components/home/BadgeProducts'
import VideoProductSlider from '@/components/home/VideoProductSlider'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import Testimonials from '@/components/home/Testimonials'
import SpotlightSection from '@/components/home/SpotlightSection'
import DualBanner from '@/components/home/DualBanner'
import TrustBadges from '@/components/home/TrustBadges'
import BrandMarquee from '@/components/home/BrandMarquee'
import HomeSkeleton from '@/components/home/HomeSkeleton'

import type { Product, Category, SiteImage, SlidingCard, Testimonial, HomeBundle } from '@/lib/types'

interface HomeClientProps {
  settings: SiteSettings
  tags: string[]
  initialBundle?: HomeBundle
}

export default function HomeClient({ settings, tags, initialBundle }: HomeClientProps) {
  const [products, setProducts] = useState<Product[]>(initialBundle?.products || [])
  const [allCategories, setAllCategories] = useState<Category[]>(initialBundle?.categories || [])
  const [siteImages, setSiteImages] = useState<SiteImage[]>(initialBundle?.siteImages || [])
  const [slidingCards, setSlidingCards] = useState<SlidingCard[]>(initialBundle?.slidingCards || [])
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>(
    (initialBundle?.featuredCategories && initialBundle.featuredCategories.length > 0)
      ? initialBundle.featuredCategories
      : (initialBundle?.categories || [])
  )
  const [videos, setVideos] = useState<any[]>(initialBundle?.videos || [])
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialBundle?.testimonials || [])
  const [loading, setLoading] = useState(
    !initialBundle || !initialBundle.products || initialBundle.products.length === 0
  )

  useEffect(() => {
    // If SSR bundle was provided, skip duplicate client-side fetch to save mobile network & CPU
    if (initialBundle && initialBundle.products && initialBundle.products.length > 0) {
      return;
    }

    async function fetchData() {
      try {
        setLoading(true)
        const bundle = await getHomeBundle()
        setProducts(bundle.products || [])
        setAllCategories(bundle.categories || [])
        setSiteImages(bundle.siteImages || [])
        setSlidingCards(bundle.slidingCards || [])
        setFeaturedCategories(
          (bundle.featuredCategories && bundle.featuredCategories.length > 0)
            ? bundle.featuredCategories
            : (bundle.categories || [])
        )
        setVideos(bundle.videos || [])
        setTestimonials(bundle.testimonials || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [initialBundle])

  if (loading) {
    return <HomeSkeleton />
  }

  const homeBanner1 = siteImages.find(img => img.id === 'home-banner-1')
  const homeBanner2 = siteImages.find(img => img.id === 'home-banner-2')

  return (
    <>
      {/* Heart Rain Effect - Floating Hearts */}
      {/* <HeartRain /> */}
      {/* <HeartRain /> */}

      {/* Trending Ticker - Global */}
      <TrendingTicker />

      <div className="container mx-auto px-4 pt-4 md:hidden">
        <form action="/shop" method="get" className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            name="search"
            placeholder="Search products..."
            className="pl-10 pr-12 py-2 border rounded-full w-full"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full p-0"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Free Delivery Banner */}
      <PromoBanners siteImages={siteImages} />

      {/* Sliding Hero Section - Right after Banner (Desktop shows here) */}
      <SlidingHero slides={(() => {
        const heroSlides = siteImages
          .filter(img => img.id.startsWith('hero-') && img.isVisible !== false)
          .map(img => ({
            id: img.id,
            name: img.name || '',
            description: img.description || '',
            imageUrl: img.imageUrl,
            linkUrl: img.linkUrl || '/shop',
            buttonText: img.buttonText
          }));

        if (heroSlides.length > 0) return heroSlides;

        return [
          {
            id: 'hero-1',
            name: '100% Pure & Unpolished Shree Anna Millets',
            description: 'Directly sourced from trusted Indian farmers. Naturally gluten-free & high-fibre superfoods.',
            imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1920&q=80',
            linkUrl: '/collections/all',
            buttonText: 'Shop Millets'
          },
          {
            id: 'hero-2',
            name: 'Nutrient-Dense Stone-Ground Atta & Rawa',
            description: 'Freshly milled Barnyard, Browntop, Foxtail, Ragi & Jowar flours for a healthier family.',
            imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=80',
            linkUrl: '/collections/flour',
            buttonText: 'Explore Flours'
          },
          {
            id: 'hero-3',
            name: 'Traditional Homemade Aam Ka Achaar',
            description: 'Authentic Bihari style mango pickle crafted in pure mustard oil without chemical preservatives.',
            imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1920&q=80',
            linkUrl: '/products/millet-yard-premium-traditional-aam-ka-achaar-mango-pickle-authentic-indian-homemade-style-mango-pickle-1-kg',
            buttonText: 'Order Pickle'
          }
        ];
      })()} />

      {/* Sliding Cards Section - Mobile Only */}
      <div className="bg-transparent md:hidden pt-0 pb-8">
        <SlidingCards cards={slidingCards} />
      </div>

      {/* Image Grid - After Sliding Cards */}
      <ImageGrid siteImages={siteImages} />

      {/* Popular Products - After Image Grid */}
      <PopularProducts products={products.slice(0, 8)} />

      {/* Quick Links from Icon Grid */}
      <div className="bg-transparent">
        <IconCategoryGrid />
      </div>

      {/* Featured Collections - Slider */}
      <FeaturedCollections categories={featuredCategories.length > 0 ? featuredCategories : allCategories} />

      {/* Category Showcase - Animated Grid (Trending Collections) */}
      <CategoryShowcase categories={allCategories} products={products} />

      {/* Shop By Category - Static Grid — Top 3 categories by product count */}
      <ShopByCategory categories={allCategories} products={products} />

      {/* Spotlight Section - Slider from site_images */}
      <SpotlightSection siteImages={siteImages} />

      {/* Dual Banner - Two landscape images side by side */}
      <DualBanner siteImages={siteImages} />

      {/* Discount Deals Section */}
      <DiscountDeals />

      {/* Promo Slider - Right below Discount Deals */}
      <PromoSlider siteImages={siteImages} />

      {/* Video Bestsellers Slider (Artisans At Work) */}
      <VideoProductSlider products={products} />

      {/* Shop by Occasion */}
      <ShopByOccasion products={products} tags={tags || []} />

      {/* Badge/Featured Products */}
      <BadgeProducts products={products} />

      {/* Bestsellers - Top 8 most ordered (computed from existing products) */}
      <BestSellers products={products} />

      {/* Testimonials */}
      <Testimonials testimonials={testimonials} />

      {/* Customer Reviews - Separate from Testimonials */}
      <div className="bg-transparent">
        <ReviewsCarousel />
      </div>

      {/* Video Gallery (Watch & Shop) */}
      <div className="bg-transparent">
        <VideoGallery videos={videos} />
      </div>

      {/* Instagram Feed */}
      <InstagramFeed siteImages={siteImages} settings={settings} />

      {/* Company / Certification Logos Marquee */}
      <BrandMarquee />

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Recently Viewed */}
      <RecentlyViewed />
    </>
  )
}
