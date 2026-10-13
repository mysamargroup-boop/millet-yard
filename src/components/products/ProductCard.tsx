
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, Heart } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn, isVideoUrl, slugify } from '@/lib/utils';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import CheckoutModal from '../checkout/CheckoutModal';
import { BLUR_DATA_URL } from '@/lib/constants';
import { trackAddToCart, trackWishlistAdd, trackBeginCheckout } from '@/lib/analytics';
import { useSettings } from '@/lib/settings-context';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const { settings } = useSettings();
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const categorySlug = product.category ? slugify(product.category.split(',')[0].trim()) : 'uncategorized';
  const productUrl = `/collections/${categorySlug}/${slugify(product.name)}`;
  const DEFAULT_FALLBACK_IMAGE = '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png';
  const rawImg = product.imageUrl || DEFAULT_FALLBACK_IMAGE;
  const initialImageUrl = rawImg.endsWith('/0.png') ? rawImg.replace('/0.png', '/image_1.png') : rawImg;
  const [currentImg, setCurrentImg] = useState(initialImageUrl);

  useEffect(() => {
    const raw = product.imageUrl || DEFAULT_FALLBACK_IMAGE;
    setCurrentImg(raw.endsWith('/0.png') ? raw.replace('/0.png', '/image_1.png') : raw);
  }, [product.imageUrl]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const currentUrl = baseUrl ? `${baseUrl}${productUrl}` : '';

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isClient) {
      const discountedSubtotal = product.price;

      trackBeginCheckout([{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        quantity: 1
      }], discountedSubtotal);

      try {
        sessionStorage.setItem('milletyard_buynow', JSON.stringify({
          product,
          quantity: 1,
        }));
      } catch {}

      router.push('/checkout?buyNow=1');
    }
  };

  const isInWishlist = wishlist.some(item => item.id === product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast({ title: "Removed from Wishlist", description: `${product.name} removed from your wishlist.` });
    } else {
      addToWishlist(product);
      trackWishlistAdd({
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category
      });
      toast({ title: "Added to Wishlist", description: `${product.name} added to your wishlist.` });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    trackAddToCart({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_category: product.category,
      quantity: 1
    });
  };

  const discountedSubtotal = product.price; // This is the effective selling price
  const originalSubtotal = product.regularPrice || product.price; // Use regular price if available, else current price

  const shippingCost = discountedSubtotal > (settings?.free_shipping_threshold ?? 2999) ? 0 : 99;

  const totalCost = discountedSubtotal + shippingCost;
  const originalTotalCost = originalSubtotal + shippingCost;


  return (
    <div
      ref={cardRef}
      className={cn(
        "h-full transition-all duration-700 ease-out transform",
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-[0.98]"
      )}
    >
      <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group bg-card h-full relative rounded-2xl border hover:border-emerald-500/30">
        {/* ... existing card content ... */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          {product.badge && (
            <Badge className="shadow-md" variant="secondary">{product.badge}</Badge>
          )}
          {product.salePrice && product.regularPrice && product.regularPrice > 0 && (
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] md:text-[11px] font-bold px-1.5 py-0.5 rounded-sm transform -skew-x-12 shadow-sm border border-white/10">
              <span className="inline-block transform skew-x-12">
                {Math.round((1 - Number(product.salePrice) / Number(product.regularPrice)) * 100)}% OFF
              </span>
            </div>
          )}
        </div>

        <CardHeader className="p-0 relative">
          <Link href={productUrl}>
            <div className="aspect-square relative">
              {isVideoUrl(currentImg) ? (
                <video
                  src={currentImg}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <Image
                  src={currentImg}
                  alt={product.imageAlt || product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={product.imageHint}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  onError={() => {
                    setCurrentImg(DEFAULT_FALLBACK_IMAGE);
                  }}
                />
              )}
            </div>
          </Link>
          <Button
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background z-20"
            onClick={handleWishlistToggle}
          >
            <Heart className={cn("h-4 w-4 text-foreground", isInWishlist && "fill-destructive text-destructive")} />
          </Button>

          {/* Color Swatches */}
          {product.colorOptions && product.colorOptions.length > 0 && (
            <div className="absolute bottom-2 right-2 flex -space-x-1.5 z-10 px-1">
              {product.colorOptions.slice(0, 3).map((color, i) => (
                <div
                  key={color.name || i}
                  className="w-4 h-4 rounded-full border border-white shadow-sm ring-1 ring-black/5"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              {product.colorOptions.length > 3 && (
                <div className="w-4 h-4 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-900 shadow-sm ring-1 ring-black/5">
                  +{product.colorOptions.length - 3}
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-2 flex flex-col justify-between flex-1">
          {/* 1. Title Container - strictly locked height */}
          <Link href={productUrl} className="block mb-1">
            <h3
              className="font-headline font-bold text-xs sm:text-sm md:text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-2 h-9 sm:h-10 overflow-hidden"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          {/* 2. Badges Container - strictly locked height */}
          <div className="flex flex-wrap content-start items-center gap-1 text-[10px] md:text-xs h-9 md:h-11 overflow-hidden mb-1">
            {product.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 md:h-5 truncate max-w-[120px]">
                {product.category.split(',')[0]}
              </Badge>
            )}
            {product.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 md:h-5 truncate max-w-[110px]">
                {tag}
              </Badge>
            ))}
          </div>

          {/* 3. Price Container - strictly locked height */}
          <div className="h-7 flex items-baseline gap-1 md:gap-1.5 pt-0.5">
            <span className="font-bold text-sm md:text-lg bg-clip-text text-transparent bg-gradient-to-r from-red-900 via-red-800 to-red-700">
              ₹{product.salePrice ? Number(product.salePrice).toFixed(2) : Number(product.regularPrice || product.price || 0).toFixed(2)}
            </span>
            {product.salePrice && product.regularPrice && product.regularPrice > Number(product.salePrice) && (
              <span className="text-[11px] md:text-sm text-muted-foreground line-through">
                ₹{Number(product.regularPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* 4. Description Container - strictly locked height */}
          <div className="h-5 flex items-center overflow-hidden">
            {(() => {
              const rawDesc = product.specificDescription || product.shortDescription;
              let clean = '';
              if (rawDesc) {
                let trimmed = rawDesc.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(trimmed);
                    clean = parsed['Product Description'] || parsed['Description'] || parsed['short_description'] || '';
                  } catch {}
                } else {
                  clean = trimmed;
                }
                clean = clean.replace(/\\u[0-9a-fA-F]{4}/g, '•').replace(/\n+/g, ' ').trim();
                if (clean.startsWith('{') || clean.startsWith('"')) clean = '';
              }
              return (
                <p className="text-[11px] md:text-xs text-muted-foreground truncate w-full">
                  {clean || '100% Pure, Unpolished Traditional Millets'}
                </p>
              );
            })()}
          </div>
        </CardContent>

        <CardFooter className="p-3 pt-0 flex flex-col items-stretch gap-2">
          {/* 5. Rating & Add to Cart Row - strictly locked height */}
          <div className="flex items-center justify-between h-8">
            {product.rating && product.reviewCount ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={cn("w-3 h-3", star <= Math.round(product.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200")} />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{product.rating}</span>
                <span className="text-[10px] sm:text-xs">({product.reviewCount})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-foreground">4.9</span>
                <span className="text-[10px] sm:text-xs">(24)</span>
              </div>
            )}
            <Button
              onClick={handleAddToCart}
              className="rounded-full h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary/20 disabled:bg-muted disabled:text-muted-foreground"
              disabled={product.inventory === 0}
              variant="outline"
              size="icon"
              title="Add to Cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {/* 6. Buy Now Button */}
          <Button
            onClick={handleBuyNow}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white font-semibold text-xs sm:text-sm shine-effect shadow-sm"
            disabled={product.inventory === 0}
            size="sm"
          >
            <Zap className="h-3.5 w-3.5 text-amber-300 mr-1.5" />
            <span>Buy Now</span>
          </Button>
        </CardFooter>
      </Card>
      <CheckoutModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        checkoutMode={checkoutMode}
        checkoutInput={{
          sku: product.id,
          productName: product.name,
          productDescription: product.description,
          originalPrice: originalSubtotal,
          productPrice: discountedSubtotal,
          discountPercentage: originalSubtotal > discountedSubtotal ? Math.round((1 - discountedSubtotal / originalSubtotal) * 100) : 0,
          quantity: 1,
          shippingCost: shippingCost,
          totalCost: totalCost,
          productUrls: currentUrl ? [currentUrl] : [],
        }}
      />
    </div>
  );
};

export default ProductCard;
