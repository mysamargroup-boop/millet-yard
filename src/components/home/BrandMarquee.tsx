'use client';

import React from 'react';
import Image from 'next/image';
import Marquee from '@/components/ui/marquee';
import { ShieldCheck, Award, Leaf, HeartHandshake, CheckCircle2, Building2, Sparkles } from 'lucide-react';

interface PartnerItem {
  id: string;
  name: string;
  category: string;
  logoSrc?: string;
  icon?: React.ElementType;
  badgeText?: string;
  badgeColor?: string;
}

const BRAND_PARTNERS: PartnerItem[] = [
  {
    id: 'millet-yard',
    name: 'Millet Yard',
    category: 'Direct Farmer Collective',
    logoSrc: '/logo.png',
    badgeText: 'Official Brand',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'fssai',
    name: 'FSSAI Certified',
    category: 'Govt. Food Safety Standards',
    icon: ShieldCheck,
    badgeText: 'Lic. Verified',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'jaivik-bharat',
    name: 'Jaivik Bharat / Organic',
    category: 'National Organic Standards',
    icon: Leaf,
    badgeText: '100% Natural',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  },
  {
    id: 'apeda',
    name: 'APEDA India',
    category: 'Agri Export Authority',
    icon: Award,
    badgeText: 'Recognized',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'shree-anna',
    name: 'Shree Anna Mission',
    category: 'National Millets Initiative',
    icon: Sparkles,
    badgeText: 'IYM Global',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  {
    id: 'make-in-india',
    name: 'Make In India',
    category: 'Sourced & Milled in Bharat',
    icon: Building2,
    badgeText: 'Atmanirbhar',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  {
    id: 'nabl-tested',
    name: 'NABL Lab Tested',
    category: 'Chemical & Pesticide Free',
    icon: CheckCircle2,
    badgeText: 'Zero Residue',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  },
  {
    id: 'fpo-direct',
    name: '500+ Farmer FPOs',
    category: 'Fair Price Direct Sourcing',
    icon: HeartHandshake,
    badgeText: 'Ethical Trade',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
];

export default function BrandMarquee() {
  return (
    <section className="py-10 md:py-14 border-y border-border/60 bg-gradient-to-b from-amber-50/40 via-background to-background dark:from-slate-900/40 dark:via-background dark:to-background overflow-hidden relative">
      <div className="container mx-auto px-4 mb-6 md:mb-8 text-center">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
          Trusted By 25,000+ Health-Conscious Indian Families
        </h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl mx-auto">
          From farm cooperatives to strict food safety certifications — our purity is independently verified.
        </p>
      </div>

      {/* Marquee with edge gradient fade */}
      <div className="relative w-full overflow-hidden">
        {/* Left Fade Gradient */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />

        {/* Right Fade Gradient */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

        <Marquee pauseOnHover className="[--duration:35s] [--gap:1.25rem] py-2">
          {BRAND_PARTNERS.map((brand) => {
            const IconComponent = brand.icon;
            return (
              <div
                key={brand.id}
                className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 min-w-[240px] max-w-[280px] shrink-0 group hover:border-emerald-500/50"
              >
                {/* Logo / Emblem */}
                <div className="relative h-11 w-11 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center overflow-hidden p-1.5 group-hover:scale-105 transition-transform">
                  {brand.logoSrc ? (
                    <Image
                      src={brand.logoSrc}
                      alt={brand.name}
                      width={40}
                      height={40}
                      className="object-contain w-full h-full"
                    />
                  ) : IconComponent ? (
                    <IconComponent className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                  ) : null}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {brand.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {brand.category}
                  </p>
                  {brand.badgeText && (
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${brand.badgeColor}`}>
                      {brand.badgeText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </Marquee>
      </div>
    </section>
  );
}
