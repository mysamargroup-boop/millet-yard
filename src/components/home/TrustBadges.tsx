'use client';

import { Shield, Truck, RefreshCw, Award, Heart, Clock } from 'lucide-react';
import React from 'react';

export default function TrustBadges() {
    const badges = [
        {
            icon: Shield,
            title: 'Secure Payment',
            description: '100% secure',
            color: 'text-blue-600'
        },
        {
            icon: Truck,
            title: 'Free Shipping',
            description: 'Above ₹999',
            color: 'text-green-600'
        },
        {
            icon: RefreshCw,
            title: 'Easy Returns',
            description: '7-day policy',
            color: 'text-orange-600'
        },
        {
            icon: Award,
            title: 'Premium Quality',
            description: 'Handcrafted',
            color: 'text-purple-600'
        },
        {
            icon: Heart,
            title: 'Made with Love',
            description: 'Artisan crafted',
            color: 'text-red-600'
        },
        {
            icon: Clock,
            title: '24/7 Support',
            description: 'Always here',
            color: 'text-indigo-600'
        }
    ];

    return (
        <section className="pt-8 md:pt-12 pb-8 md:pb-12 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-y-8 items-start">
                    {badges.map((badge, index) => (
                        <div key={index} className="relative group flex flex-col items-center text-center p-2 md:p-4 transition-all duration-300">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 border border-orange-100 group-hover:border-orange-200">
                                <badge.icon className={`w-5 h-5 md:w-6 md:h-6 ${badge.color}`} />
                            </div>
                            <h3 className="font-bold text-[10px] md:text-xs text-gray-900 mb-0.5 leading-tight">
                                {badge.title}
                            </h3>
                            <p className="text-[8px] md:text-[10px] text-muted-foreground leading-tight">
                                {badge.description}
                            </p>

                            {/* Vertical Divider */}
                            {index < badges.length - 1 && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 md:h-14 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden md:block" />
                            )}
                            {(index + 1) % 3 !== 0 && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent md:hidden" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
