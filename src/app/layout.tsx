
import { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import ClientLayout from '@/components/layout/ClientLayout';

import { getSiteSettings } from '@/lib/data-async';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://milletyard.com'),
    title: {
        default: "Millet Yard - 100% Natural, Unpolished Millets & Superfoods",
        template: "%s | Millet Yard"
    },
    description: "Buy 100% natural, unpolished millets, freshly ground millet flours, roasted sattu, and authentic traditional Indian superfoods online at Millet Yard.",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/favicon.png', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
    openGraph: {
        type: "website",
        locale: "en_IN",
        siteName: "Millet Yard",
    },
    twitter: {
        card: "summary_large_image",
    }
};

export const viewport = {
    themeColor: "#108474",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const settings = await getSiteSettings();

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <link rel="manifest" href="/manifest.webmanifest" />
            </head>
            <body className={cn('min-h-screen font-body antialiased flex flex-col overflow-x-hidden')} suppressHydrationWarning>
                <ClientLayout settings={settings}>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
