'use client';

import { useState, useEffect } from 'react';

interface RecentlyViewedProduct {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    category: string;
    timestamp: number;
}

const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const MAX_ITEMS = 10;
const EXPIRY_DAYS = 7;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
            if (stored) {
                const parsed: RecentlyViewedProduct[] = JSON.parse(stored);
                // Filter expired items (older than 7 days)
                const now = Date.now();
                const filtered = parsed.filter(item => now - item.timestamp < EXPIRY_MS);
                setRecentlyViewed(filtered);

                // Update localStorage if items were expired
                if (filtered.length !== parsed.length) {
                    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));
                }
            }
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        }
    }, []);

    // Add a product to recently viewed
    const addToRecentlyViewed = (product: Omit<RecentlyViewedProduct, 'timestamp'>) => {
        if (typeof window === 'undefined') return;

        setRecentlyViewed(prev => {
            // Remove if already exists
            const filtered = prev.filter(p => p.id !== product.id);

            // Add new item at the beginning
            const newItem: RecentlyViewedProduct = {
                ...product,
                timestamp: Date.now()
            };

            // Limit to MAX_ITEMS
            const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

            // Save to localStorage
            try {
                localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving recently viewed:', error);
            }

            return updated;
        });
    };

    // Clear all recently viewed
    const clearRecentlyViewed = () => {
        if (typeof window === 'undefined') return;

        setRecentlyViewed([]);
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
    };

    return {
        recentlyViewed,
        addToRecentlyViewed,
        clearRecentlyViewed,
        isEmpty: recentlyViewed.length === 0
    };
}
