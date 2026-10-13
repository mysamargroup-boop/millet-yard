

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, Zap, Heart, Share2, Upload, X, Truck, Info, MessageCircle, Sparkles, ChevronDown, Flame, Eye } from 'lucide-react';
import type { Product, OrderItem, SiteSettings, ProductVariant } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { cn, slugify } from '@/lib/utils';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from '@/components/ui/input';
import { BLUR_DATA_URL } from '@/lib/constants';
import ProductInfoBadges from '@/components/products/ProductInfoBadges';
import ReviewsCarousel from '@/components/products/ReviewsCarousel';
import StockUrgency from '@/components/products/StockUrgency';
import ProductFOMO from '@/components/products/ProductFOMO';
import SaleCountdownTimer from '@/components/products/SaleCountdownTimer';
import ProductQA from '@/components/products/ProductQA';
import SizeGuideModal from '@/components/products/SizeGuideModal';
import Link from 'next/link';
import { useSettings } from '@/lib/settings-context';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';

const ImageUpload = ({ onFilesChange }: { onFilesChange: (files: File[]) => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file));
    };
  }, [selectedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newFiles = [...selectedFiles, ...files].slice(0, 3);
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="my-6 p-4 border-dashed border-2 rounded-lg text-center">
      <h3 className="font-semibold mb-3 text-lg">Personalize with Your Photos</h3>
      <p className="text-muted-foreground text-sm mb-4">Upload up to 3 images for customization.</p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {selectedFiles.map((file, index) => (
          <div key={index} className="relative aspect-square">
            <Image
              src={URL.createObjectURL(file)}
              alt={`Preview ${index + 1}`}
              fill
              className="rounded-md object-cover"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="100px"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => handleRemoveFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {selectedFiles.length < 3 && (
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Choose Files ({selectedFiles.length}/3)
        </Button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        disabled={selectedFiles.length >= 3}
      />
    </div>
  );
};


export default function ProductDetailClient({ product, sizeGuideImageUrl }: { product: Product; sizeGuideImageUrl?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [customImages, setCustomImages] = useState<File[]>([]);
  const [quantityType, setQuantityType] = useState<'preset' | 'custom'>('preset');
  const [customQuantity, setCustomQuantity] = useState<number | string>(1);
  const { settings } = useSettings();
  const [isClient, setIsClient] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const currentUrl = isClient ? window.location.href : (baseUrl ? `${baseUrl}${pathname}` : '');

  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(product.imageUrl);

  // Variant State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);

  // Update selected image when variant changes
  useEffect(() => {
    if (currentVariant && currentVariant.imageUrl) {
      setSelectedImage(currentVariant.imageUrl);
    } else if (product.imageUrl) {
      setSelectedImage(product.imageUrl);
    }
  }, [currentVariant, product.imageUrl]);

  // Initialize options from first available variant or defaults
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      // Default to first variant
      const firstVar = product.variants[0];
      setSelectedOptions(firstVar.options || {});
      setCurrentVariant(firstVar);
    } else if (product.options && product.options.length > 0) {
      // Default to first value of each option if no variants generated (fallback)
      const defaults: Record<string, string> = {};
      product.options.forEach(opt => {
        if (opt.values && opt.values.length > 0) defaults[opt.name] = opt.values[0];
      });
      setSelectedOptions(defaults);
    }
  }, [product]);

  // Update current variant when options change
  useEffect(() => {
    if (!product.variants || product.variants.length === 0) return;

    const matchingVariant = product.variants.find(v => {
      const vOptions = v.options || {};
      return Object.entries(selectedOptions).every(([key, val]) => vOptions[key] === val);
    });

    setCurrentVariant(matchingVariant || null);
  }, [selectedOptions, product.variants]);

  // Parse structured data (Health Benefits, Manufacturing, Shipping, Returns)
  const structuredData = useMemo(() => {
    if (!product.specificDescription) return null;
    const raw = product.specificDescription.trim();
    if (!raw.startsWith('{')) return null;
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      try {
        const sanitized = raw.replace(/[\r\n]+/g, '\\n');
        return JSON.parse(sanitized) as Record<string, string>;
      } catch {
        return null;
      }
    }
  }, [product.specificDescription]);

  // Clean list of health benefits
  const healthBenefitsList = useMemo(() => {
    const raw = structuredData?.['Health Benefits'];
    if (!raw) return [];
    const text = raw.replace(/\.s dige$/i, '').trim();
    if (text.includes('\n') || text.includes('•')) {
      return text
        .split(/[\n•]+/)
        .map(s => s.trim())
        .filter(s => s.length > 5);
    }
    return text.split(/(?<=\.)(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 5);
  }, [structuredData]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // Update URL when color changes
    if (optionName.toLowerCase() === 'color' && searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('color', slugify(value));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  // Price Logic
  const rawBase = currentVariant?.price ?? product.regularPrice ?? product.price ?? 0;
  const basePrice = Number(rawBase) || 0;
  const rawSale = currentVariant?.salePrice ?? product.salePrice;
  const displaySalePrice = rawSale !== undefined && rawSale !== null ? Number(rawSale) : null;
  // If there's a sale price, that's the final price. Otherwise base price.
  const displayPrice = displaySalePrice !== null && !isNaN(displaySalePrice) ? displaySalePrice : basePrice;

  const getColorHex = (colorName: string) => {
    // 1. Try to find in colorOptions from database
    if (product.colorOptions && Array.isArray(product.colorOptions)) {
      const option = product.colorOptions.find(
        (o: any) => o.name?.toLowerCase() === colorName.toLowerCase()
      );
      if (option?.value) return option.value;
    }

    // 2. Fallback to hardcoded common colors
    const name = colorName.toLowerCase();
    if (name.includes('red')) return '#ef4444';
    if (name.includes('blue')) return '#3b82f6';
    if (name.includes('green')) return '#10b981';
    if (name.includes('yellow')) return '#eab308';
    if (name.includes('black')) return '#000000';
    if (name.includes('white')) return '#ffffff';
    if (name.includes('brown')) return '#92400e';
    if (name.includes('pink')) return '#ec4899';
    if (name.includes('purple')) return '#9333ea';
    if (name.includes('orange')) return '#f97316';
    if (name.includes('gray')) return '#6b7280';
    if (name.includes('grey')) return '#6b7280';
    if (name.includes('teal')) return '#14b8a6';
    if (name.includes('maroon')) return '#800000';
    if (name.includes('navy')) return '#1e3a8a';
    if (name.includes('gold')) return '#d4af37';
    if (name.includes('silver')) return '#c0c0c0';

    return '#6b7280'; // Default gray
  };

  const displayStock = currentVariant ? currentVariant.stock : product.inventory;
  const isOutOfStock = displayStock <= 0;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track recently viewed product
  const { addToRecentlyViewed } = useRecentlyViewed();
  useEffect(() => {
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.salePrice ?? product.price,
      category: product.category,
    });
  }, [product.id]);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);


    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const isInWishlist = wishlist.some(item => item.id === product.id);

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast({ title: "Removed from Wishlist", description: `${product.name} removed from your wishlist.` });
    } else {
      addToWishlist(product);
      toast({ title: "Added to Wishlist", description: `${product.name} added to your wishlist.` });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription,
          url: currentUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({ title: "Could not share", description: "Sharing was cancelled or failed." });
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(currentUrl);
      toast({ title: "Link Copied", description: "Product link copied to clipboard." });
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out ${product.name}!\n${currentUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleBuyNow = () => {
    if (!isClient) return;
    try {
      sessionStorage.setItem('milletyard_buynow', JSON.stringify({
        product: {
          ...product,
          price: displayPrice,
          salePrice: displayPrice,
        },
        quantity: finalQuantity,
        selectedVariant: currentVariant,
        selectedOptions: selectedOptions,
      }));
    } catch {}
    router.push('/checkout?buyNow=1');
  };

  const finalQuantity = quantityType === 'preset' ? quantity : (typeof customQuantity === 'number' ? customQuantity : 0);

  const exceedsStock = finalQuantity > displayStock;

  const areActionsDisabled =
    (product.variants && product.variants.length > 0 && !currentVariant) || // Strict check: if variants exist, one MUST be selected
    (product.allowImageUpload && customImages.length === 0) ||
    finalQuantity <= 0 ||
    exceedsStock ||
    isOutOfStock; // Added isOutOfStock

  const discountedSubtotal = displayPrice * finalQuantity; // Changed from product.price
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const shippingCost = discountedSubtotal > freeShippingThreshold ? 0 : 99;
  const totalCost = discountedSubtotal + shippingCost;

  const presetQuantities = [1, 2, 5, 10];

  const deliveryMinDays = settings?.expected_delivery_min_days ?? 7;
  const deliveryMaxDays = settings?.expected_delivery_max_days ?? 15;

  const [liveViewers, setLiveViewers] = useState(14);
  useEffect(() => {
    const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const initial = 11 + (hash % 16);
    setLiveViewers(initial);
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(6, Math.min(38, prev + delta));
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [product.id]);

  const productsForCheckout: OrderItem[] = [{
    id: product.id,
    name: product.name,
    quantity: finalQuantity,
    price: displayPrice, // Changed from product.price
    imageUrl: product.imageUrl,
    imageHint: product.imageHint,
  }];

  return (
    <>
      <div className='text-left space-y-4'>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="font-headline text-2xl font-bold lg:text-3xl tracking-tight text-foreground">{product.name}</h1>
            {/* Hurry, only few packs left in stock! */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500 animate-pulse shrink-0" />
              <span>Hurry, only few packs left in stock!</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-green-200 hover:bg-green-50 hover:border-green-400" onClick={handleWhatsAppShare}>
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* 🏷️ 3 Columns: SKU | Estimated Delivery | Live Viewers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground">
          {/* Column 1: SKU — Refined clean high-legibility font */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-muted-foreground/80 uppercase text-[11px] tracking-wider shrink-0">SKU:</span>
            <span className="font-sans font-semibold text-foreground/90 tracking-wide truncate px-2 py-0.5 rounded-md bg-background/80 border border-border/50 text-xs shadow-2xs">
              {product.id.length > 18 ? product.id.slice(0, 16).toUpperCase() : product.id.toUpperCase()}
            </span>
          </div>

          {/* Column 2: Estimated Delivery */}
          <div className="flex items-center gap-1.5 min-w-0 sm:border-x sm:border-border/60 sm:px-2">
            <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground/90 truncate">
              Delivery: <strong className="font-semibold text-foreground">{deliveryMinDays}-{deliveryMaxDays} days</strong>
            </span>
          </div>

          {/* Column 3: People Viewing */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium text-foreground/90 flex items-center gap-1.5 truncate">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span><strong className="font-bold text-foreground">{liveViewers}</strong> people viewing</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {product.category && (
            <Link href={`/collections/${slugify(product.category.split(',')[0].trim())}`}>
              <Badge variant="outline">{product.category}</Badge>
            </Link>
          )}
          {product.subCategory && (
            <Badge variant="secondary">{product.subCategory}</Badge>
          )}
        </div>

        <div className="space-y-2">
          {/* 💰 Product Price & Reviews Row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-900 via-red-800 to-red-700">
                {displaySalePrice ? `₹${displaySalePrice.toFixed(0)}` : `₹${displayPrice.toFixed(0)}`}
              </span>
              {displaySalePrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{basePrice.toFixed(0)}
                  </span>
                  <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-sm transform -skew-x-12 shadow-sm border border-white/10">
                    <span className="inline-block transform skew-x-12">
                      {Math.round(((basePrice - displaySalePrice) / basePrice) * 100)}% OFF
                    </span>
                  </div>
                </>
              )}
            </div>
            {product.rating && product.reviewCount && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm border-l pl-3.5 text-muted-foreground">
                <span className="font-bold text-foreground">{product.rating} / 5</span>
                <span>({product.reviewCount} Reviews)</span>
              </div>
            )}
          </div>

          {/* (Inclusive of all taxes) directly below price */}
          <p className="text-[11px] text-muted-foreground/80 font-normal">
            (Inclusive of all taxes)
          </p>

          {/* 📝 Product Description — Positioned directly below price & taxes */}
          {product.shortDescription && (
            <div className="mt-2 text-slate-800 dark:text-slate-200 font-medium leading-relaxed text-sm md:text-base whitespace-pre-line space-y-1.5">
              {product.shortDescription}
            </div>
          )}

          {/* 💰 You Save Callout — shows savings amount */}
          {displaySalePrice && displaySalePrice < basePrice && (
            <div className="flex items-center gap-2 px-3.5 py-2 mt-3 rounded-lg bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-300/50">
              <span className="text-base">🏷️</span>
              <span className="text-sm font-bold text-emerald-700">
                You save ₹{(basePrice - displaySalePrice).toFixed(0)} on this order!
              </span>
            </div>
          )}

          {/* ⏱ Sale Countdown Timer — toggle in SaleCountdownTimer.tsx */}
          <SaleCountdownTimer className="!mt-4" />

          {/* Variants Selectors */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-4 py-4 border-t border-b">
              {product.options.map(opt => (
                <div key={opt.id} className="space-y-3">
                  <span className="font-semibold text-sm">{opt.name}</span>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map(val => {
                      const isSelected = selectedOptions[opt.name] === val;
                      const isColor = opt.name.toLowerCase() === 'color';

                      return (
                        <button
                          key={val}
                          onClick={() => handleOptionChange(opt.name, val)}
                          className={`px-4 py-2 rounded-md border text-sm transition-all
                               ${isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary'
                              : 'hover:border-gray-400'
                            }
                            ${isColor ? 'w-12 h-12 p-0 rounded-full border-2' : ''}
                             `}
                          style={isColor ? {
                            backgroundColor: getColorHex(val)
                          } : {}}
                          title={val}
                        >
                          {!isColor && val}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Size Guide Button - only when category has a size guide */}
          {sizeGuideImageUrl && (
            <SizeGuideModal imageUrl={sizeGuideImageUrl} categoryName={product.category} />
          )}
        </div>

        {/* Stock Urgency & Real-Time FOMO Suite */}
        <div className="!mt-1">
          <ProductFOMO productName={product.name} stock={displayStock} />
        </div>

        {/* Free Shipping Indicator */}
        {displayPrice >= freeShippingThreshold && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
            <Truck className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="font-semibold text-sm text-green-700">🎉 FREE Shipping on this item!</p>
          </div>
        )}
        {displayPrice < freeShippingThreshold && (
          <div className="p-3 mt-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex items-center gap-2">
            <Info className="h-4 w-4 text-zinc-500" />
            <p className="text-sm font-medium text-zinc-900">
              Add <span className="text-emerald-600 font-bold">₹{(freeShippingThreshold - displayPrice).toFixed(0)}</span> more for <span className="text-emerald-600 font-extrabold uppercase tracking-wide">FREE shipping</span>
            </p>
          </div>
        )}

        {/* Fallback for unstructured plain text description */}
        {!structuredData && product.specificDescription && !product.specificDescription.startsWith('{') && (
          <div className="bg-muted/20 p-3.5 rounded-xl border border-border/50 text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.specificDescription}
          </div>
        )}

        {product.allowImageUpload && <ImageUpload onFilesChange={setCustomImages} />}

        {product.allowImageUpload && customImages.length > 0 && (
          <input type="hidden" name="customerImages" value={JSON.stringify(customImages.map(f => f.name))} />
        )}

        <div className="flex flex-col gap-4 pt-4">
          {/* 🏷️ Instant Coupon Offer Strip — Positioned directly above Select Quantity */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/80 border border-amber-300/80 text-amber-950 dark:from-amber-950/30 dark:via-slate-900/40 dark:to-amber-950/30 dark:border-amber-800/60 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">🏷️</span>
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Use code </span>
                <span className="font-mono font-bold text-amber-900 dark:text-amber-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-[11px]">MILLET10</span>
                <span className="text-slate-700 dark:text-slate-300"> for 10% instant discount</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('MILLET10');
                toast({ title: 'Coupon Copied! 🎉', description: 'Code MILLET10 copied. Apply at checkout for 10% OFF.' });
              }}
              className="shrink-0 text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:text-amber-950 bg-white dark:bg-slate-900 hover:bg-amber-100/50 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs transition-colors cursor-pointer"
            >
              Copy
            </button>
          </div>

          {/* 🔢 Select Quantity Section */}
          <div className="space-y-3">
            <Label className="font-semibold">Select Quantity</Label>
            <div className="flex flex-wrap items-center gap-2">
              {presetQuantities.map(q => (
                <Button
                  key={q}
                  type="button"
                  variant={quantity === q && quantityType === 'preset' ? "default" : "outline"}
                  className="rounded-lg"
                  onClick={() => {
                    setQuantity(q);
                    setQuantityType('preset');
                  }}
                  disabled={isOutOfStock}
                >
                  {q}
                </Button>
              ))}
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  placeholder="Custom"
                  value={customQuantity}
                  onFocus={() => setQuantityType('custom')}
                  onChange={(e) => {
                    setQuantityType('custom');
                    const val = e.target.value;
                    setCustomQuantity(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                  }}
                  className={cn(
                    "w-28 text-center font-semibold rounded-lg bg-muted/50",
                    quantityType === 'custom' && "border-primary ring-2 ring-primary bg-background"
                  )}
                  disabled={isOutOfStock}
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleWishlistToggle} className="ml-auto rounded-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                <Heart className={cn("h-5 w-5", isInWishlist ? "fill-red-500 text-red-500" : "text-foreground")} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button size="lg" onClick={() => addToCart(product, finalQuantity, currentVariant, selectedOptions)} className="w-full h-12 bg-primary hover:bg-primary/80 rounded-lg text-base" disabled={areActionsDisabled}>
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button size="lg" onClick={handleBuyNow} className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white shine-effect rounded-lg text-base" disabled={areActionsDisabled}>
              <Zap className="mr-2 h-5 w-5 text-yellow-300" /> Buy Now
            </Button>
          </div>

          {/* Product Highlights & Key Benefits — Positioned directly below Add to Cart & Buy Now buttons (No Star Icon) */}
          {healthBenefitsList.length > 0 && (
            <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-background p-4 space-y-2 shadow-xs">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Product Highlights & Key Benefits
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {healthBenefitsList.slice(0, 4).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                    <span className="leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Return Policy Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 text-blue-900 rounded-lg text-sm border border-blue-100">
            <div className="mt-0.5 p-1 bg-blue-100 rounded-full">
              <Info className="h-3 w-3 text-blue-600" />
            </div>
            <p className="leading-relaxed">
              <span className="font-bold">Returns:</span> 7 days return policy. Contact <a href={`mailto:${settings?.contact_email || 'support@milletyard.com'}`} className="underline font-medium hover:text-blue-700">{settings?.contact_email || 'support@milletyard.com'}</a> for returns.
            </p>
          </div>
        </div>

        <div className="my-6 text-left pt-4 border-t">
          <Accordion type="single" collapsible defaultValue="item-benefits" className="w-full space-y-3 sm:space-y-3.5">
            {healthBenefitsList.length > 0 && (
              <AccordionItem value="item-benefits" className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-card shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden data-[state=open]:border-emerald-500/40 data-[state=open]:shadow-xs">
                <AccordionTrigger hideIcon className="px-5 py-4 sm:py-4.5 hover:no-underline font-headline font-bold text-base sm:text-[17px] text-emerald-950 dark:text-emerald-50 flex items-center justify-between w-full text-left">
                  <span className="flex items-center gap-2">🌱 Health Benefits & Ayurvedic Nutrition</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300/90 dark:border-neutral-700 flex items-center justify-center shrink-0 ml-3 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs group-hover:border-emerald-600 transition-colors">
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                  <ul className="space-y-2.5 pl-1 text-sm text-slate-700 dark:text-slate-300">
                    {healthBenefitsList.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                        <span className="leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {structuredData?.['Manufacturing'] && (
              <AccordionItem value="item-manufacturing" className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-card shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden data-[state=open]:border-emerald-500/40 data-[state=open]:shadow-xs">
                <AccordionTrigger hideIcon className="px-5 py-4 sm:py-4.5 hover:no-underline font-headline font-bold text-base sm:text-[17px] text-emerald-950 dark:text-emerald-50 flex items-center justify-between w-full text-left">
                  <span className="flex items-center gap-2">🌾 Traditional Milling & Purity Standards</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300/90 dark:border-neutral-700 flex items-center justify-center shrink-0 ml-3 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs group-hover:border-emerald-600 transition-colors">
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                  <p className="leading-relaxed">
                    {structuredData['Manufacturing']}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {structuredData?.['Shipping'] && (
              <AccordionItem value="item-shipping" className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-card shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden data-[state=open]:border-emerald-500/40 data-[state=open]:shadow-xs">
                <AccordionTrigger hideIcon className="px-5 py-4 sm:py-4.5 hover:no-underline font-headline font-bold text-base sm:text-[17px] text-emerald-950 dark:text-emerald-50 flex items-center justify-between w-full text-left">
                  <span className="flex items-center gap-2">🚚 Express Shipping & Packaging</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300/90 dark:border-neutral-700 flex items-center justify-center shrink-0 ml-3 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs group-hover:border-emerald-600 transition-colors">
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                  <p className="leading-relaxed">
                    {structuredData['Shipping']}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {structuredData?.['Return Policy'] && (
              <AccordionItem value="item-return" className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-card shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden data-[state=open]:border-emerald-500/40 data-[state=open]:shadow-xs">
                <AccordionTrigger hideIcon className="px-5 py-4 sm:py-4.5 hover:no-underline font-headline font-bold text-base sm:text-[17px] text-emerald-950 dark:text-emerald-50 flex items-center justify-between w-full text-left">
                  <span className="flex items-center gap-2">🛡️ 100% Quality Guarantee & Returns</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300/90 dark:border-neutral-700 flex items-center justify-center shrink-0 ml-3 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs group-hover:border-emerald-600 transition-colors">
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                  <p className="leading-relaxed">
                    {structuredData['Return Policy']}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {(product.features && product.features.length > 0) && (
              <AccordionItem value="item-2" className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-card shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden data-[state=open]:border-emerald-500/40 data-[state=open]:shadow-xs">
                <AccordionTrigger hideIcon className="px-5 py-4 sm:py-4.5 hover:no-underline font-headline font-bold text-base sm:text-[17px] text-emerald-950 dark:text-emerald-50 flex items-center justify-between w-full text-left">
                  <span>Key Features</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300/90 dark:border-neutral-700 flex items-center justify-center shrink-0 ml-3 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs group-hover:border-emerald-600 transition-colors">
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                  <ul className="space-y-2.5 list-disc pl-5 text-muted-foreground text-sm">
                    {product.features.map((feature, index) => (
                      <li key={index}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="item-3" className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-card shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden data-[state=open]:border-emerald-500/40 data-[state=open]:shadow-xs">
              <AccordionTrigger hideIcon className="px-5 py-4 sm:py-4.5 hover:no-underline font-headline font-bold text-base sm:text-[17px] text-emerald-950 dark:text-emerald-50 flex items-center justify-between w-full text-left">
                <span>Highlights & Specifications</span>
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-300/90 dark:border-neutral-700 flex items-center justify-center shrink-0 ml-3 bg-white dark:bg-neutral-800 text-emerald-950 dark:text-emerald-100 shadow-2xs group-hover:border-emerald-600 transition-colors">
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">SKU</td>
                      <td className="py-2 font-medium font-sans text-right text-foreground/90 uppercase text-xs">
                        {product.id.length > 22 ? product.id.slice(0, 18) : product.id}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Manufacturer</td>
                      <td className="py-2 font-semibold text-right">
                        Millet Yard
                      </td>
                    </tr>
                    {product.weightGrams && (
                      <tr className="border-b">
                        <td className="py-2 text-muted-foreground">Weight</td>
                        <td className="py-2 font-semibold text-right">{product.weightGrams}g</td>
                      </tr>
                    )}
                    {product.dimensionsCm && (
                      <tr>
                        <td className="py-2 text-muted-foreground">Dimensions</td>
                        <td className="py-2 font-semibold text-right">{product.dimensionsCm.length} x {product.dimensionsCm.width} x {product.dimensionsCm.height} cm</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <ProductInfoBadges />

          {/* ❓ Ask a Question — Public Q&A Section */}
          <ProductQA productName={product.name} productId={product.id} />
        </div>

      </div>
      <CheckoutModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        checkoutMode={checkoutMode}
        checkoutInput={{
          sku: product.id,
          productName: `${product.name}${currentVariant?.options ? ` (${Object.values(currentVariant.options).join(' / ')})` : ''}`,
          productDescription: product.description,
          originalPrice: basePrice * finalQuantity,
          productPrice: discountedSubtotal,
          discountPercentage: 0,
          quantity: finalQuantity,
          shippingCost: shippingCost,
          totalCost: totalCost,
          productUrls: currentUrl ? [currentUrl] : [],
          products: productsForCheckout,
        }}
      />

      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t shadow-lg transition-transform duration-300 ease-in-out z-40 pb-16 md:pb-0",
        showStickyBar ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <Image src={product.imageUrl || '/placeholder-image.svg'} alt={product.imageAlt || product.name} width={40} height={40} className="rounded-md object-cover flex-shrink-0" data-ai-hint={product.imageHint} placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="40px" />
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{product.name}</p>
                {displaySalePrice && displaySalePrice < displayPrice ? ( // Updated to use displayPrice/displaySalePrice
                  <div className="flex items-center gap-2">
                    <p className="text-accent text-xs font-semibold">₹{displaySalePrice.toFixed(2)}</p>
                    <p className="text-muted-foreground text-[11px] line-through">₹{basePrice.toFixed(2)}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    ₹{displayPrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 w-20">
                <Input
                  type="number"
                  min="1"
                  value={finalQuantity}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                    if (presetQuantities.includes(val)) {
                      setQuantityType('preset');
                      setQuantity(val);
                    } else {
                      setQuantityType('custom');
                      setCustomQuantity(val);
                    }
                  }}
                  className="w-full h-9 text-center"
                />
              </div>
              <Button onClick={() => addToCart(product, finalQuantity, currentVariant, selectedOptions)} variant="outline" className="hidden xs:inline-flex rounded-lg" disabled={areActionsDisabled}>
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} size="icon" className="xs:hidden rounded-lg bg-green-600 hover:bg-green-700" disabled={areActionsDisabled}>
                <Zap className="h-4 w-4 text-yellow-300" />
              </Button>
              <Button onClick={handleBuyNow} className="hidden xs:inline-flex rounded-lg bg-green-600 hover:bg-green-700" disabled={areActionsDisabled}>
                <Zap className="mr-2 h-4 w-4 text-yellow-300" /> Buy Now
              </Button>
              <Button onClick={() => addToCart(product, finalQuantity, currentVariant, selectedOptions)} size="icon" className="xs:hidden" disabled={areActionsDisabled}>
                <ShoppingCart className="h-4 w-4" />
              </Button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
