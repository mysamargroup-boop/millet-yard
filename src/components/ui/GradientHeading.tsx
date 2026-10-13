
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, LayoutGrid, Sparkles, Tag, ShoppingBag, Star, TrendingUp, Flame, Clock, Heart, Video, Instagram, MessageSquare } from 'lucide-react';

interface GradientHeadingProps {
    title?: string;
    text?: string;
    subtitle?: string;
    icon?: string;
    variant?: 'default' | 'centered' | 'left';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    underlineClassName?: string;
    id?: string;
}

const iconMap: Record<string, LucideIcon> = {
    'LayoutGrid': LayoutGrid,
    'Sparkles': Sparkles,
    'Tag': Tag,
    'ShoppingBag': ShoppingBag,
    'Star': Star,
    'TrendingUp': TrendingUp,
    'Flame': Flame,
    'Clock': Clock,
    'Heart': Heart,
    'Video': Video,
    'Instagram': Instagram,
    'MessageSquare': MessageSquare
};

export default function GradientHeading({
    title,
    text,
    subtitle,
    icon,
    variant = 'centered',
    size = 'lg',
    className,
    underlineClassName,
    id
}: GradientHeadingProps) {
    const IconComponent = icon ? iconMap[icon] : null;
    const finalTitle = title || text || '';
    const headingRef = useRef<HTMLDivElement>(null);
    const [underlineWidth, setUnderlineWidth] = useState(0);

    const sizeClasses = {
        sm: 'text-base md:text-lg',
        md: 'text-lg md:text-xl',
        lg: 'text-xl md:text-2xl lg:text-3xl',
        xl: 'text-2xl md:text-3xl lg:text-4xl'
    };

    const iconSizeClasses = {
        sm: 'h-4 w-4 md:h-5 md:w-5',
        md: 'h-5 w-5 md:h-6 md:w-6',
        lg: 'h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8',
        xl: 'h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9'
    };

    const finalVariant = variant === 'default' ? 'centered' : variant;

    useEffect(() => {
        if (headingRef.current) {
            setUnderlineWidth(headingRef.current.offsetWidth);
        }
        const handleResize = () => {
            if (headingRef.current) {
                setUnderlineWidth(headingRef.current.offsetWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [finalTitle]);

    return (
        <div id={id} className={cn(
            "flex flex-col mb-4 md:mb-6",
            finalVariant === 'centered' ? "items-center text-center" : "items-start text-left",
            className
        )}>
            {/* Title row — icon inline next to text */}
            <div ref={headingRef} className={cn(
                "inline-flex items-center gap-2",
                finalVariant === 'centered' ? "justify-center" : "justify-start"
            )}>
                {IconComponent && (
                    <IconComponent className={cn(iconSizeClasses[size], "text-orange-600 flex-shrink-0")} />
                )}
                <h2 className={cn(
                    "font-bold font-headline tracking-tight",
                    sizeClasses[size],
                    "bg-clip-text text-transparent bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600"
                )}>
                    {finalTitle}
                </h2>
            </div>



            {subtitle && (
                <p className="text-muted-foreground text-xs md:text-sm max-w-2xl font-light leading-relaxed mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
