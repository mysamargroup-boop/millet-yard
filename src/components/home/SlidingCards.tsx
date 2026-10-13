"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BLUR_DATA_URL } from '@/lib/constants';

interface SlidingCard {
  id: string;
  title: string;
  description: string;
  image_url: string;
  image_hint?: string;
  link_url?: string;
  order_num: number;
  active: boolean;
}

const PLACEHOLDER_SLIDING_CARDS: SlidingCard[] = [
  {
    id: 'sc1',
    title: '100% Unpolished Shree Anna Millets',
    description: 'Sourced ethically from tribal farmers. Naturally unpolished, rich in dietary fiber, iron, and minerals with zero chemical processing.',
    image_url: '/images/products/barnyard-millet-shreeanna-500-gram/image_1.png',
    order_num: 1,
    active: true,
    link_url: '/collections/millets'
  },
  {
    id: 'sc2',
    title: 'Stone-Ground Wholesome Atta',
    description: 'Slow-milled diabetic-friendly flours preserving natural enzymes and vitamins. Perfect for light, nutritious everyday rotis.',
    image_url: '/images/products/browntop-millet-atta-100-natural-millet-flour-high-fibre-wholesome-nutrition/image_1.png',
    order_num: 2,
    active: true,
    link_url: '/collections/flour'
  }
];

interface SlidingCardsProps {
  cards: SlidingCard[];
  autoPlay?: boolean;
  interval?: number;
}

export default function SlidingCards({ cards, autoPlay = true, interval = 5000 }: SlidingCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [progress, setProgress] = useState(0);

  const activeCards = cards.filter(card => card.active).sort((a, b) => a.order_num - b.order_num);
  const displayCards = activeCards.length > 0 ? activeCards : PLACEHOLDER_SLIDING_CARDS;

  /**
   * Section Overview:
   * This component manages a sliding banner/carousel on the mobile view.
   * - It filters and sorts 'active' cards from the props.
   * - Uses an interval-based progress bar for auto-playing slides.
   * - Each slide can have a title, description, and an optional link.
   * - The main image is displayed with an aspect ratio of 4:5 on mobile.
   */

  // Progress bar animation logic
  useEffect(() => {
    if (!autoPlay || displayCards.length <= 1) {
      return;
    }

    setProgress(0);
    const progressInterval = 50; // Update every 50ms for smooth animation
    const steps = interval / progressInterval;
    let currentStep = 0;

    const progressTimer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        setCurrentIndex((prev) => (prev + 1) % displayCards.length);
        currentStep = 0;
        setProgress(0);
      }
    }, progressInterval);

    return () => clearInterval(progressTimer);
  }, [autoPlay, interval, displayCards.length, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + displayCards.length) % displayCards.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayCards.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      goToNext();
      setProgress(0);
    } else if (distance < -50) {
      goToPrevious();
      setProgress(0);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (displayCards.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
    >
      {/* Main Sliding Container with touch events */}
      <div
        className="relative aspect-[4/5] md:aspect-[16/9] w-auto mx-4 md:w-full md:max-w-6xl md:mx-auto overflow-hidden rounded-2xl group touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Slide Track */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {displayCards.map((card, index) => (
            <div key={card.id || index} className="relative min-w-full h-full flex-shrink-0">
              {card.link_url ? (
                <Link
                  href={card.link_url}
                  className="block w-full h-full relative"
                >
                  <Image
                    src={card.image_url}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint={card.image_hint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10" />
                </Link>
              ) : (
                <div className="w-full h-full relative">
                  <Image
                    src={card.image_url}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint={card.image_hint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10" />
                </div>
              )}

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none">
                <h3 className="text-2xl md:text-3xl font-bold font-headline mb-2 drop-shadow-lg">
                  {card.title}
                </h3>
                {card.description && (
                  <p className="text-sm md:text-base opacity-90 drop-shadow-md line-clamp-3">
                    {card.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {displayCards.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 z-30 opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 z-30 opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Indicators with Progress */}
      {displayCards.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {displayCards.map((_, index) => (
            <button
              key={index}
              onClick={() => { goToSlide(index); setProgress(0); }}
              className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: index === currentIndex ? '48px' : '12px' }}
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Background */}
              <div className={`absolute inset-0 rounded-full ${index === currentIndex ? 'bg-white/40' : 'bg-white/50 hover:bg-white/75'
                }`} />
              {/* Progress Fill */}
              {index === currentIndex && (
                <div
                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
