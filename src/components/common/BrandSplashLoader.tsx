'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface BrandSplashLoaderProps {
  logoUrl?: string;
}

export default function BrandSplashLoader({ logoUrl = '/logo.png' }: BrandSplashLoaderProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/sr-admin');

  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Skip loader on admin pages
    if (isAdmin) {
      setIsVisible(false);
      return;
    }

    // Phase 1: Keep blinking logo visible for 1.4 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1400);

    // Phase 2: Complete smooth fade-out and unmount from DOM at 2.0 seconds
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [isAdmin]);

  // Click anywhere to instantly dismiss loader (no-blocking UX)
  const handleDismiss = () => {
    setIsFading(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible || isAdmin) return null;

  return (
    <div
      onClick={handleDismiss}
      aria-label="Loading Millet Yard"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-all duration-600 ease-out select-none cursor-pointer ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, rgba(16, 132, 116, 0.12) 0%, rgba(255, 255, 255, 0.98) 65%, #ffffff 100%)',
      }}
    >
      {/* Ambient background soft glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Transparent Logo without any background box — with blinking/pulsing animation */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <div className="relative w-56 sm:w-72 md:w-80 h-24 sm:h-28 md:h-32 flex items-center justify-center animate-logo-blink">
          <Image
            src={logoUrl || '/logo.png'}
            alt="Millet Yard"
            width={320}
            height={110}
            priority
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Minimal Subtle Pulse Dots */}
        <div className="flex items-center gap-2 mt-4">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" style={{ animationDuration: '1.2s' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-800 animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.4s' }} />
        </div>

        {/* Minimal Brand Tagline */}
        <p className="mt-3 text-xs sm:text-[13px] tracking-widest font-semibold uppercase text-emerald-900/80 dark:text-emerald-300/80 text-center animate-pulse">
          100% Pure • Native Millets • Superfoods
        </p>
      </div>
    </div>
  );
}
