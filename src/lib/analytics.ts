export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

// Define window.gtag
declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event',
            targetId: string,
            config?: { [key: string]: any }
        ) => void;
    }
}

// Helper to track page views (optional, as GA4 does this automatically usually, but good for manual control)
export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('config', GA_TRACKING_ID, {
            page_path: url,
        });
    }
};

// Generic event tracker
export const event = ({ action, category, label, value }: { action: string, category: string, label: string, value?: number }) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

interface ProductEventItem {
    item_id: string;
    item_name: string;
    price: number;
    item_category?: string;
    quantity?: number;
}

// E-commerce: Add to Cart
export const trackAddToCart = (product: ProductEventItem) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('event', 'add_to_cart', {
            currency: 'INR',
            value: product.price * (product.quantity || 1),
            items: [
                {
                    item_id: product.item_id,
                    item_name: product.item_name,
                    price: product.price,
                    item_category: product.item_category,
                    quantity: product.quantity || 1
                }
            ]
        });
    }
};

// E-commerce: Add to Wishlist
export const trackWishlistAdd = (product: ProductEventItem) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('event', 'add_to_wishlist', {
            currency: 'INR',
            value: product.price,
            items: [
                {
                    item_id: product.item_id,
                    item_name: product.item_name,
                    price: product.price,
                    item_category: product.item_category,
                    quantity: 1
                }
            ]
        });
    }
};

// E-commerce: Begin Checkout
export const trackBeginCheckout = (products: ProductEventItem[], totalValue: number) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('event', 'begin_checkout', {
            currency: 'INR',
            value: totalValue,
            items: products
        });
    }
}

// User Action: Search
export const trackSearch = (searchTerm: string) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('event', 'search', {
            search_term: searchTerm
        });
    }
}
