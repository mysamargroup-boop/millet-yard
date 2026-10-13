"use client";

import { cn } from "@/lib/utils";
import Marquee from "@/components/ui/marquee";

export default function TrendingTicker() {
    const messages = [
        "🌾 100% Pure, Unpolished & Stone-Ground Shree Anna Millets",
        "✨ Naturally Gluten-Free & Low Glycemic Index Superfoods",
        "🚚 Free Express Shipping on Orders Above ₹499",
        "🌱 Directly Sourced From Native Indian Farmers",
        "⭐ 4.9★ Rated by 15,000+ Health-Conscious Families",
    ];

    return (
        <div className="bg-accent text-accent-foreground py-3 border-y border-border">
            <Marquee pauseOnHover className="[--duration:30s]">
                {messages.map((item, i) => (
                    <div key={i} className="mx-8 flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-wider">{item}</span>
                        <span className="text-xl leading-none">&bull;</span>
                    </div>
                ))}
            </Marquee>
        </div>
    );
}
