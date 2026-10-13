'use client';

import { useState, useEffect } from 'react';
import { Flame, Eye, Truck, Clock, Sparkles } from 'lucide-react';

interface ProductFOMOProps {
  productName: string;
  stock?: number;
}

export default function ProductFOMO({ productName, stock }: ProductFOMOProps) {
  const [mounted, setMounted] = useState(false);
  const [viewers, setViewers] = useState(14);
  const [soldLast24h, setSoldLast24h] = useState(27);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });

  const [displayStock, setDisplayStock] = useState(4);

  useEffect(() => {
    setMounted(true);

    // 1. Time-Dynamic Seed (2-Hour Traffic Windows with Peak/Off-Peak Waves)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentHour = now.getHours();
    const hourBucket = Math.floor(currentHour / 2); // Shifts smoothly every 2 hours
    const seedStr = `${productName}_${todayStr}_h${hourBucket}`;
    
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    }
    const absHash = Math.abs(hash);

    // Realistic Time-of-Day Multiplier:
    // Peak shopping hours (7 PM - 11 PM) -> 1.4x traffic
    // Afternoon lunch hours (12 PM - 5 PM) -> 1.15x traffic
    // Late night (1 AM - 5 AM) -> 0.55x traffic
    // Morning (6 AM - 11 AM) -> 0.9x traffic
    let timeMultiplier = 1.0;
    if (currentHour >= 19 && currentHour <= 23) timeMultiplier = 1.45;
    else if (currentHour >= 12 && currentHour <= 18) timeMultiplier = 1.15;
    else if (currentHour >= 1 && currentHour <= 5) timeMultiplier = 0.55;
    else timeMultiplier = 0.9;

    const baseViewers = Math.round((10 + (absHash % 12)) * timeMultiplier);
    const baseSold = Math.round((20 + (absHash % 18)) * timeMultiplier);
    const baseStock = (stock !== undefined && stock > 0 && stock <= 12) ? stock : (3 + (absHash % 5));

    // 2. Check SessionStorage per 2-hour window so refresh is rock-solid
    const sessionKey = `fomo_data_${productName}_h${hourBucket}`;
    const cachedData = sessionStorage.getItem(sessionKey);
    let finalViewers = baseViewers;
    let finalSold = baseSold;
    let finalStock = baseStock;

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        finalViewers = parsed.viewers;
        finalSold = parsed.sold;
        finalStock = parsed.stock;
      } catch {}
    } else {
      sessionStorage.setItem(sessionKey, JSON.stringify({
        viewers: finalViewers,
        sold: finalSold,
        stock: finalStock
      }));
    }

    setViewers(finalViewers);
    setSoldLast24h(finalSold);
    setDisplayStock(finalStock);

    sessionStorage.setItem(`fomo_viewers_${productName}`, finalViewers.toString());
    sessionStorage.setItem(`fomo_sold_${productName}`, finalSold.toString());
    sessionStorage.setItem(`fomo_stock_${productName}`, finalStock.toString());

    // 3. Dispatch countdown: target is 5:00 PM today (or 5:00 PM tomorrow if past 5:00 PM)
    const computeNextCutoff = (): number => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(17, 0, 0, 0); // 5:00 PM daily dispatch cutoff
      if (now.getTime() >= cutoff.getTime()) {
        cutoff.setDate(cutoff.getDate() + 1);
      }
      return cutoff.getTime();
    };

    let deadlineMs = computeNextCutoff();
    const storedDeadline = sessionStorage.getItem('fomo_dispatch_deadline');
    if (storedDeadline) {
      const parsed = parseInt(storedDeadline, 10);
      if (!isNaN(parsed) && parsed > Date.now()) {
        deadlineMs = parsed;
      } else {
        sessionStorage.setItem('fomo_dispatch_deadline', deadlineMs.toString());
      }
    } else {
      sessionStorage.setItem('fomo_dispatch_deadline', deadlineMs.toString());
    }

    const updateTimer = () => {
      const now = Date.now();
      if (deadlineMs <= now) {
        deadlineMs = computeNextCutoff();
        sessionStorage.setItem('fomo_dispatch_deadline', deadlineMs.toString());
      }
      const diff = Math.max(0, deadlineMs - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // Micro-fluctuation for realism while user is staying on the page (not refresh)
    const viewersInterval = setInterval(() => {
      setViewers(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        const updated = Math.max(8, Math.min(35, prev + delta));
        sessionStorage.setItem(`fomo_viewers_${productName}`, updated.toString());
        return updated;
      });
    }, 20000);

    return () => {
      clearInterval(viewersInterval);
      clearInterval(timerInterval);
    };
  }, [productName, stock]);

  if (!mounted) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="pt-1">
      {/* Dispatch Countdown Timer - Clean Natural Inline Text */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-300/70 text-slate-800 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/40 dark:border-amber-800/40 dark:text-amber-100 shadow-xs">
        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
        <div className="text-xs sm:text-[13px] flex-1 text-slate-700 dark:text-slate-300 leading-normal font-sans">
          <span>Order within </span>
          <span className="font-bold text-amber-800 dark:text-amber-300 tracking-tight tabular-nums">
            {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
          </span>
          <span> for <strong className="font-semibold text-slate-900 dark:text-white">Same-Day Packing & Priority Dispatch</strong></span>
        </div>
      </div>
    </div>
  );
}
