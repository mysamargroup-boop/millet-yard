
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function TrendingTicker() {
    // TODO: Fetch this from site_settings later
    const [messages] = useState([
        "🌾 100% Pure, Stone-Ground & Unpolished Shree Anna Millets",
        "✨ Free Shipping on orders above ₹499",
        "🌱 Directly Sourced From Native Indian Farmers",
        "💎 10% OFF on your first order with code MILLET10"
    ]);

    return (
        <div className="bg-primary text-primary-foreground py-2 overflow-hidden relative z-40 border-b border-white/10">
            <div className="flex animate-marquee whitespace-nowrap">
                {/* Repeat content to ensure smooth seamless loop */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-8 mx-4">
                        {messages.map((msg, index) => (
                            <span key={index} className="text-xs font-medium tracking-wide flex items-center gap-2">
                                {msg}
                                <span className="w-1 h-1 rounded-full bg-white/50" />
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
