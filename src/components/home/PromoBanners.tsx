
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import type { SiteSettings, SiteImage } from '@/lib/types';
import { Truck } from 'lucide-react';
import { getPublicSiteSettings } from '@/lib/public-settings';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';

interface PromoBannersProps {
  siteImages: SiteImage[];
}

export default function PromoBanners({ siteImages }: PromoBannersProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicSiteSettings();
        setSettings(data as SiteSettings);
      } catch {
      }
    })();
  }, []);

  const bannerEnabled = settings?.promo_banner_enabled ?? true;
  if (!bannerEnabled) {
    return null;
  }

  const freeShippingThreshold = settings?.free_shipping_threshold ?? 999;
  const title = settings?.promo_banner_title || 'Free Delivery Unlocked!';
  const subtitle = settings?.promo_banner_subtitle || `On all orders above ₹${freeShippingThreshold}`;

  const promoImage = (siteImages || []).find(img => img.id === 'promo-banner-delivery' && img.isVisible !== false);


  return (
    <section className="w-full mt-4 mb-2 md:mb-4 px-4 bg-transparent">
      <Card className="overflow-hidden text-white shine-effect border-none shadow-none rounded-2xl" style={{
        backgroundColor: '#cd1c18',
        backgroundImage: 'linear-gradient(326deg, #cd1c18 0%, #66023c 74%)'
      }}>
        <CardContent className="p-0 flex items-center justify-between">
          <div className="pl-6 py-4">
            <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
            <p className="text-white/80 text-sm">{subtitle}</p>
          </div>
          <div className="w-28 aspect-square flex-shrink-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {promoImage ? (
                <Image
                  src={promoImage.imageUrl}
                  alt={promoImage.name || promoImage.description || "Millet Yard Special Delivery Offer"}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  sizes="80px"
                />
              ) : (
                <Truck className="h-12 w-12 text-white" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
