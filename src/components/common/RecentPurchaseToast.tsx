'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';

const RECENT_PURCHASES = [
  { name: 'Pooja S.', city: 'Bengaluru', product: 'Barnyard Millet Atta (1kg)', time: '2 mins ago', image: '/images/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour/image_1.png' },
  { name: 'Rajesh K.', city: 'New Delhi', product: 'Jowar Idli Rawa (500g)', time: '6 mins ago', image: '/images/products/jowar-idli-rawa/image_1.png' },
  { name: 'Meera V.', city: 'Pune', product: 'BrownTop Millet Atta (100% Natural)', time: '11 mins ago', image: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png' },
  { name: 'Karthik N.', city: 'Chennai', product: 'Nutritious Ragi Laddoo', time: '15 mins ago', image: '/images/products/nutritious-ragi-laddoo/image_1.png' },
  { name: 'Ananya D.', city: 'Mumbai', product: 'Foxtail Millet Atta (Pack of 2)', time: '18 mins ago', image: '/images/products/millet-yard-foxtail-millet-atta/image_1.png' },
  { name: 'Amit G.', city: 'Jaipur', product: 'Aam Ka Achaar (Traditional 1kg)', time: '23 mins ago', image: '/images/products/millet-yard-premium-traditional-aam-ka-achaar-mango-pickle-authentic-indian-homemade-style-mango-pickle-1-kg/image_1.png' },
  { name: 'Sneha R.', city: 'Hyderabad', product: 'Sprouted Jowar Flour (High Fibre)', time: '29 mins ago', image: '/images/products/sprouted-jowar-flour/image_1.png' },
];

export default function RecentPurchaseToast() {
  const [current, setCurrent] = useState<typeof RECENT_PURCHASES[0] | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show first toast after 4 seconds
    const initialTimer = setTimeout(() => {
      showNextToast();
    }, 4000);

    // Then cycle every 24 seconds
    const interval = setInterval(() => {
      showNextToast();
    }, 24000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  const showNextToast = () => {
    // Fade out any existing toast first
    setVisible(false);

    // Wait for exit transition, then set new toast and fade in
    setTimeout(() => {
      const randomItem = RECENT_PURCHASES[Math.floor(Math.random() * RECENT_PURCHASES.length)];
      setCurrent(randomItem);
      setVisible(true);

      // Fade out after 6 seconds
      setTimeout(() => {
        setVisible(false);
      }, 6000);
    }, 700);
  };

  if (!current || dismissed) return null;

  return (
    <div
      className={`fixed bottom-24 left-3 sm:bottom-12 md:bottom-16 sm:left-6 z-40 max-w-[calc(100vw-24px)] sm:max-w-sm transition-all duration-700 ease-in-out transform ${
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-3 scale-95 pointer-events-none"
      }`}
    >
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-border/80 flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
          <Image
            src={current.image}
            alt={current.product}
            fill
            className="object-cover"
            onError={(e: any) => {
              // fallback
              e.currentTarget.src = '/placeholder-image.svg';
            }}
          />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{current.name}</span>
            <span>from {current.city}</span>
            <CheckCircle2 className="h-3 w-3 text-emerald-500 fill-emerald-100" />
          </div>
          <p className="text-xs font-semibold text-foreground truncate mt-0.5" title={current.product}>
            Bought {current.product}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium font-sans tracking-tight">Verified Purchase</span>
            <span>•</span>
            <span>{current.time}</span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
