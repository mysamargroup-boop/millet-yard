"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BLUR_DATA_URL } from '@/lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint?: string;
  linkUrl?: string;
  buttonText?: string;
}

interface SlidingHeroProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  interval?: number;
}

export default function SlidingHero({ slides, autoPlay = true, interval = 5000 }: SlidingHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Progress bar animation
  useEffect(() => {
    if (!autoPlay || isPaused || slides.length <= 1) {
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
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        currentStep = 0;
        setProgress(0);
      }
    }, progressInterval);

    return () => clearInterval(progressTimer);
  }, [autoPlay, isPaused, interval, slides.length, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="hidden md:block relative w-full h-[500px] lg:h-[600px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <Image
        src={currentSlide.imageUrl}
        alt={currentSlide.name || 'Millet Yard 100% Pure Unpolished Shree Anna Millets & Superfoods'}
        fill
        sizes="100vw"
        className="object-cover"
        priority
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-xl text-white">
            <h1 className="text-4xl lg:text-6xl font-headline font-bold leading-tight mb-4">
              {currentSlide.name || '100% Pure & Unpolished Shree Anna Millets'}
            </h1>
            <p className="text-lg lg:text-xl text-white/80 mb-6">
              {currentSlide.description || 'Cold stone-ground flours, traditional grains & authentic superfoods straight from Indian farms.'}
            </p>
            <div className="flex gap-4">
              {currentSlide.buttonText && (
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link href={currentSlide.linkUrl || "/shop"}>{currentSlide.buttonText}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
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
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {slides.map((_, index) => (
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
    </section>
  );
}
