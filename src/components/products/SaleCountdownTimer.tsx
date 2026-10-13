'use client';

import { useState, useEffect } from 'react';
import { Zap, Flame } from 'lucide-react';

const SHOW_COUNTDOWN_TIMER = true;
const SALE_DURATION_HOURS = 6;

export default function SaleCountdownTimer({ className }: { className?: string }) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!SHOW_COUNTDOWN_TIMER) return;
        setMounted(true);

        const getValidEndTime = () => {
            const stored = sessionStorage.getItem('millet_flash_end');
            if (stored) {
                const parsed = parseInt(stored, 10);
                if (!isNaN(parsed) && parsed > Date.now()) {
                    return parsed;
                }
            }
            const newEnd = Date.now() + SALE_DURATION_HOURS * 60 * 60 * 1000;
            sessionStorage.setItem('millet_flash_end', newEnd.toString());
            return newEnd;
        };

        let endTime = getValidEndTime();

        const tick = () => {
            const now = Date.now();
            if (endTime <= now) {
                endTime = getValidEndTime();
            }
            const diff = Math.max(0, endTime - now);
            setTimeLeft({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!SHOW_COUNTDOWN_TIMER || !mounted) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
        <div className={`w-full max-w-full overflow-hidden box-border rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/80 dark:from-slate-900/90 dark:via-amber-950/30 dark:to-slate-900/90 p-3 sm:p-3.5 shadow-xs transition-all ${className || ''}`}>
            {/* Top row: Clean Deal Title + Modern Luxury Timing Capsules */}
            <div className="flex items-center justify-between gap-3">
                {/* Left: Clean Branding */}
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                        <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                    </span>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                            Flash Harvest Deal
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            Direct Farmer Batch • 100% Unpolished
                        </p>
                    </div>
                </div>

                {/* Right: Clean Timing Display (No Box Colors, Montserrat font) */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Ends in:
                    </span>
                    <div className="flex items-baseline gap-1 font-sans text-xs sm:text-sm font-bold tracking-tight">
                        <span className="text-slate-900 dark:text-white tabular-nums">{pad(timeLeft.hours)}<span className="text-[10px] font-medium text-slate-500 ml-0.5">h</span></span>
                        <span className="text-slate-400 font-normal">:</span>
                        <span className="text-slate-900 dark:text-white tabular-nums">{pad(timeLeft.minutes)}<span className="text-[10px] font-medium text-slate-500 ml-0.5">m</span></span>
                        <span className="text-slate-400 font-normal">:</span>
                        <span className="text-orange-600 dark:text-orange-400 tabular-nums">{pad(timeLeft.seconds)}<span className="text-[10px] font-medium text-orange-600/80 ml-0.5">s</span></span>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Simple Stock Progress */}
            <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Flame className="w-3.5 h-3.5 text-orange-600" />
                    <span>84% Claimed</span>
                    <span className="text-slate-500 text-[10px] sm:text-[11px]">(16 packs left in batch)</span>
                </div>
                <div className="flex-1 max-w-[120px] sm:max-w-[150px] h-1.5 rounded-full bg-amber-200/50 dark:bg-amber-950/60 overflow-hidden">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                </div>
            </div>
        </div>
    );
}
