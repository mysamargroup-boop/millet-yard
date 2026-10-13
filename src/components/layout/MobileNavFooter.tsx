
"use client";

import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { Home, LayoutGrid, ShoppingBag, Sparkles } from "lucide-react";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

const PRESET_THEMES = [
    { name: 'Custom / Solid', value: '', class: 'bg-white border-2' },
    { name: 'Electronics (Blue)', value: 'linear-gradient(135deg, #f0f9ff 0%, #cbebff 100%)', class: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { name: 'Fashion (Pink)', value: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)', class: 'bg-gradient-to-br from-rose-400 to-pink-500' },
    { name: 'Nature (Green)', value: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', class: 'bg-gradient-to-br from-green-400 to-emerald-600' },
    { name: 'Luxury (Gold)', value: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', class: 'bg-gradient-to-br from-amber-300 to-amber-500' },
    { name: 'Minimal (Gray)', value: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', class: 'bg-gradient-to-br from-gray-300 to-gray-500' },
    { name: 'Vibrant (Purple)', value: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', class: 'bg-gradient-to-br from-purple-400 to-purple-600' },
];

const WhatsAppIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 448 512"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
    >
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-67.6-9.5-97.2-27.2l-6.9-4.1-72.3 19 19.3-70.4-4.5-7.2c-19.1-30.4-29.7-65.7-29.7-101.7 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
);


interface NavItem {
    href: string;
    label: string;
    icon: React.ReactElement;
    isExternal?: boolean;
    activeColor?: string;
    special?: boolean;
}

const regularNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/collections', label: 'Categories', icon: <LayoutGrid className="h-5 w-5" /> },
];

const rightNavItems: NavItem[] = [
    { href: 'https://wa.me/919691045405?text=Hi%2C%20I%27m%20interested%20in%20your%20products.', label: 'WhatsApp', icon: <WhatsAppIcon />, isExternal: true, activeColor: 'text-green-500' },
    { href: '/offers', label: 'Offers', icon: <Sparkles className="h-5 w-5" />, special: true },
]

export default function MobileNavFooter() {
    const pathname = usePathname();
    const { settings } = useSettings();
    const [shopIconClass, setShopIconClass] = useState('bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 border border-amber-400/40');

    useEffect(() => {
        if (settings?.theme_gradient) {
            const matchedTheme = PRESET_THEMES.find(t => t.value === settings.theme_gradient);
            if (matchedTheme && matchedTheme.class) {
                setShopIconClass(matchedTheme.class);
            }
        }
    }, [settings]);

    const isAdminPage = pathname?.startsWith('/sr-admin');

    if (isAdminPage) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg md:hidden pb-2 px-4">
            <div className="bg-background/85 backdrop-blur-md rounded-2xl border border-border/40 shadow-2xl ring-1 ring-black/5 h-16 flex items-center justify-around">
                {regularNavItems.map((item) => {
                    const isActive = !item.isExternal && pathname && ((item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href)));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors flex-1",
                                isActive ? (item.activeColor || 'text-primary') : 'text-muted-foreground hover:text-primary'
                            )}
                            {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                            {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                            <span className={cn(
                                'text-[10px] font-medium whitespace-nowrap',
                                item.special && 'font-bold bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                <div className="flex-1 flex justify-center">
                    <Link href="/shop" className="relative -top-7 flex flex-col items-center">
                        <div className="p-1 rounded-full bg-background/90 backdrop-blur-md border border-amber-400/40 shadow-xl ring-2 ring-emerald-800/10">
                            <div className={cn(
                                "h-14 w-14 rounded-full flex items-center justify-center text-white shadow-inner transition-transform active:scale-95 shadow-emerald-950/40",
                                shopIconClass
                            )}>
                                <ShoppingBag className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </Link>
                </div>

                {rightNavItems.map((item) => {
                    const isActive = !item.isExternal && pathname && ((item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href)));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors flex-1",
                                isActive ? (item.activeColor || 'text-primary') : 'text-muted-foreground hover:text-primary'
                            )}
                            {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                            {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                            <span className={cn(
                                'text-[10px] font-medium whitespace-nowrap',
                                item.special && 'font-bold bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    )
}