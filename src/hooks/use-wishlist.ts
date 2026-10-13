"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from './use-toast';

const useWishlist = () => {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadWishlist = () => {
            try {
                const storedWishlist = sessionStorage.getItem('milletyard-wishlist');
                if (storedWishlist) {
                    setWishlist(JSON.parse(storedWishlist));
                }
            } catch (error) {
                console.error("Failed to parse wishlist from sessionStorage", error);
                sessionStorage.removeItem('milletyard-wishlist');
            } finally {
                setIsLoaded(true);
            }
        };

        loadWishlist();

        const handleWishlistUpdate = () => {
            loadWishlist();
        };

        window.addEventListener('wishlist-updated', handleWishlistUpdate);
        return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    }, []);

    const updateSessionStorage = useCallback((newWishlist: Product[]) => {
        try {
            sessionStorage.setItem('milletyard-wishlist', JSON.stringify(newWishlist));
            window.dispatchEvent(new Event('wishlist-updated'));
        } catch (error) {
            console.error("Failed to save wishlist to sessionStorage", error);
        }
    }, []);

    const addToWishlist = useCallback((product: Product) => {
        setWishlist(prevWishlist => {
            const existingItem = prevWishlist.find(item => item.id === product.id);
            if (existingItem) {
                setTimeout(() => {
                    toast({
                        title: "Already in Wishlist",
                        description: `${product.name} is already in your wishlist.`,
                    });
                }, 0);
                return prevWishlist;
            }
            const newWishlist = [...prevWishlist, product];
            updateSessionStorage(newWishlist);
            return newWishlist;
        });
    }, [updateSessionStorage, toast]);

    const removeFromWishlist = useCallback((productId: string) => {
        setWishlist(prevWishlist => {
            const newWishlist = prevWishlist.filter(item => item.id !== productId);
            updateSessionStorage(newWishlist);
            return newWishlist;
        });
    }, [updateSessionStorage]);

    // By wrapping the state setter and using a functional update, 
    // we ensure the component re-renders when the wishlist changes.
    const reliableAddToWishlist = (product: Product) => {
        setWishlist(currentWishlist => {
            if (currentWishlist.some(item => item.id === product.id)) {
                toast({
                    title: "Already in Wishlist",
                    description: `${product.name} is already in your wishlist.`,
                });
                return currentWishlist;
            }
            const newWishlist = [...currentWishlist, product];
            updateSessionStorage(newWishlist);
            return newWishlist;
        });
    };

    const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

    return { wishlist, wishlistCount, addToWishlist: reliableAddToWishlist, removeFromWishlist, isLoaded };
};

export default useWishlist;
