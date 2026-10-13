'use client';

import { useState, useEffect } from 'react';
import { Flame, Eye } from 'lucide-react';

interface StockUrgencyProps {
    stock: number;
}

// ============================================================
// 🔧 STOCK URGENCY & LIVE VIEWERS CONFIGURATION
// ============================================================
// 
// HOW TO HIDE/SHOW SECTIONS:
// 
// Option 1: Hide the ENTIRE component
//   → Go to ProductDetailClient.tsx (around line 460)
//   → Comment out or remove: <StockUrgency stock={displayStock} />
// 
// Option 2: Hide individual sections using flags below
//   → Set SHOW_LOW_STOCK_WARNING = false  → Hides "Only X pieces left in stock!"
//   → Set SHOW_LIVE_VIEWERS = false        → Hides "X people are viewing this right now"
//
// Option 3: Change the stock threshold
//   → Change STOCK_THRESHOLD value (default: 10)
//   → Low stock warning only shows when stock <= this number
//
// ============================================================

const SHOW_LOW_STOCK_WARNING = true;   // ← Set false to hide "Only X pieces left in stock!"
const SHOW_LIVE_VIEWERS = true;         // ← Set false to hide "X people are viewing this right now"
const STOCK_THRESHOLD = 10;             // ← Low stock warning shows when stock <= this number

export default function StockUrgency({ stock }: StockUrgencyProps) {
    const [viewers, setViewers] = useState(0);

    useEffect(() => {
        if (!SHOW_LIVE_VIEWERS) return;
        const base = Math.floor(Math.random() * 25) + 8;
        setViewers(base);

        const interval = setInterval(() => {
            setViewers(prev => {
                const delta = Math.floor(Math.random() * 7) - 3;
                return Math.max(5, Math.min(40, prev + delta));
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (stock <= 0) return null;

    const showStock = SHOW_LOW_STOCK_WARNING && stock <= STOCK_THRESHOLD;
    const showViewers = SHOW_LIVE_VIEWERS && viewers > 0;

    if (!showStock && !showViewers) return null;

    return (
        <div className="grid grid-cols-2 gap-2">
            {/* 🔴 LOW STOCK WARNING — toggle SHOW_LOW_STOCK_WARNING above to hide */}
            {showStock && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60">
                    <Flame className="h-4 w-4 text-red-500 animate-pulse flex-shrink-0" />
                    <p className="text-xs font-semibold text-red-700">
                        Only <span className="font-extrabold">{stock}</span> {stock === 1 ? 'piece' : 'pieces'} left!
                    </p>
                </div>
            )}
            {/* 👁 LIVE VIEWERS — toggle SHOW_LIVE_VIEWERS above to hide */}
            {showViewers && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60">
                    <Eye className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-amber-800">
                        <span className="font-bold">{viewers}</span> viewing right now
                    </p>
                </div>
            )}
        </div>
    );
}
