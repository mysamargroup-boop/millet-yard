
'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNavFooter from '@/components/layout/MobileNavFooter';
import { AuthProvider } from '@/lib/auth';
import ProgressBar from '@/components/layout/ProgressBar';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import { getSiteSettings } from '@/lib/data-async';
import type { SiteSettings } from '@/lib/types';
import { CustomerAuthProvider, useCustomerAuth } from '@/lib/customer-auth';
import Chatbot from '@/components/shop/Chatbot';
import { SettingsProvider, useSettings } from '@/lib/settings-context';
import SubscriptionPopup from '@/components/home/SubscriptionPopup';
import RecentPurchaseToast from '@/components/common/RecentPurchaseToast';
import CookieConsent from '@/components/common/CookieConsent';
import BrandSplashLoader from '@/components/common/BrandSplashLoader';

function MainLayout({ children }: { children: React.ReactNode }) {
    const { settings } = useSettings();

    const gtmId = process.env.NEXT_PUBLIC_GTM_ID || settings.google_tag_manager_id;
    const themeBackground = settings.theme_background || '0 0% 100%';
    const themeMuted = settings.theme_muted || '210 40% 96.1%';

    // Derive theme accent color from gradient selection
    const getThemeAccent = () => {
        const g = settings.theme_gradient || '';
        if (g.includes('#cbebff') || g.includes('#f0f9ff')) return { primary: '#3b82f6', secondary: '#60a5fa', tertiary: '#2563eb' };
        if (g.includes('#fff1f2') || g.includes('#fce7f3')) return { primary: '#ec4899', secondary: '#f472b6', tertiary: '#db2777' };
        if (g.includes('#fffbeb') || g.includes('#fef3c7')) return { primary: '#f59e0b', secondary: '#fbbf24', tertiary: '#d97706' };
        if (g.includes('#f9fafb') || g.includes('#f3f4f6')) return { primary: '#6b7280', secondary: '#9ca3af', tertiary: '#4b5563' };
        if (g.includes('#faf5ff') || g.includes('#f3e8ff')) return { primary: '#8b5cf6', secondary: '#a78bfa', tertiary: '#7c3aed' };
        return { primary: '#108474', secondary: '#1e5f4a', tertiary: '#0c6155' }; // Official Millet Yard Emerald Green
    };
    const accent = getThemeAccent();

    const themeStyle = (
        <style jsx global>{`
            :root {
                ${themeBackground ? `--background: ${themeBackground};` : ''}
                ${themeMuted ? `--muted: ${themeMuted};` : ''}
                --theme-accent: ${accent.primary};
                --theme-accent-secondary: ${accent.secondary};
                --theme-accent-tertiary: ${accent.tertiary};
            }
            body:not(.admin-page) {
                background-image: ${settings.theme_gradient ? settings.theme_gradient : `linear-gradient(135deg, #f0fdf4 0%, #dcfce7 25%, #ecfdf5 50%, #d1fae5 75%, #f0fdf4 100%)`};
                background-attachment: fixed;
            }
        `}</style>
    );

    return (
        <>
            {gtmId && (
                <Script id="google-tag-manager" strategy="afterInteractive">
                    {`
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${gtmId}');
                    `}
                </Script>
            )}
            {(process.env.NEXT_PUBLIC_META_PIXEL_ID || (settings as any).meta_pixel_id) && (
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || (settings as any).meta_pixel_id}');
                    fbq('track', 'PageView');
                    `}
                </Script>
            )}
            {themeStyle}

            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                forcedTheme="light"
                enableSystem={false}
                disableTransitionOnChange
            >
                {/* Decorative Background Elements - theme aware */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
                    <div
                        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
                        style={{ background: `radial-gradient(circle, ${accent.primary} 0%, transparent 70%)` }}
                    />
                    <div
                        className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.06]"
                        style={{ background: `radial-gradient(circle, ${accent.secondary} 0%, transparent 70%)` }}
                    />
                    <div
                        className="absolute top-[40%] right-[5%] w-[200px] h-[200px] rounded-full opacity-[0.04]"
                        style={{ background: `radial-gradient(circle, ${accent.tertiary} 0%, transparent 70%)` }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                    <svg className="absolute top-[20%] left-[10%] w-[300px] h-[300px] opacity-[0.04]" viewBox="0 0 200 200" fill="none">
                        <circle cx="100" cy="100" r="80" stroke={accent.primary} strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="60" stroke={accent.primary} strokeWidth="0.3" />
                        <circle cx="100" cy="100" r="40" stroke={accent.primary} strokeWidth="0.2" />
                    </svg>
                    <svg className="absolute bottom-[15%] right-[8%] w-[250px] h-[250px] opacity-[0.04]" viewBox="0 0 200 200" fill="none">
                        <rect x="40" y="40" width="120" height="120" rx="20" stroke={accent.secondary} strokeWidth="0.5" transform="rotate(15 100 100)" />
                        <rect x="60" y="60" width="80" height="80" rx="12" stroke={accent.secondary} strokeWidth="0.3" transform="rotate(30 100 100)" />
                    </svg>
                </div>

                {gtmId && (
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                        ></iframe>
                    </noscript>
                )}
                <Suspense fallback={null}>
                    <ProgressBar />
                </Suspense>
                <AuthProvider>
                    <CustomerAuthProvider>
                        <Header />
                        <main className="flex-1 pb-28 md:pb-0 relative z-[1]">{children}</main>
                        <SubscriptionPopup />
                        <RecentPurchaseToast />
                        <Footer />
                        <MobileNavFooter />
                        <Toaster />
                        <ChatbotWrapper />
                        <CookieConsent />
                    </CustomerAuthProvider>
                </AuthProvider>
            </ThemeProvider>
        </>
    );
}

function ChatbotWrapper() {
    return <Chatbot />;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <Suspense fallback={null}>
                <ProgressBar />
            </Suspense>
            <AuthProvider>
                {children}
            </AuthProvider>
            <Toaster />
        </ThemeProvider>
    );
}

export default function ClientLayout({ children, settings }: { children: React.ReactNode, settings: SiteSettings }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/sr-admin');

    // Add specific classes to body based on layout
    useEffect(() => {
        if (isAdminPage) {
            document.body.classList.add('admin-bg', 'admin-page');
            document.body.classList.remove('bg-background');
        } else {
            document.body.classList.remove('admin-bg', 'admin-page');
            document.body.classList.add('bg-background');
        }
    }, [isAdminPage]);

    return (
        <SettingsProvider initialSettings={settings}>
            <BrandSplashLoader logoUrl={settings?.logo_url || '/logo.png'} />
            {isAdminPage ? (
                <AdminLayout>{children}</AdminLayout>
            ) : (
                <MainLayout>{children}</MainLayout>
            )}
        </SettingsProvider>
    );
}
