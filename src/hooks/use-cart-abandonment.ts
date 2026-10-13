'use client';

import { useState, useEffect, useCallback } from 'react';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

interface AbandonedCartData {
    cart: CartItem[];
    customerPhone?: string;
    customerEmail?: string;
    customerName?: string;
    timestamp: number;
    totalAmount: number;
}

const ABANDONED_CART_KEY = 'abandonedCart';
const CART_KEY = 'cart'; // Your existing cart key

// Check if cart was abandoned after delay (default 2 hours)
export function useCartAbandonment(enabled: boolean = true, delayHours: number = 2) {
    const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
    const [abandonedCart, setAbandonedCart] = useState<AbandonedCartData | null>(null);

    // Save cart state periodically for recovery
    const saveCartState = useCallback(() => {
        if (typeof window === 'undefined' || !enabled) return;

        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            if (cart.length > 0) {
                const total = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
                const data: AbandonedCartData = {
                    cart,
                    timestamp: Date.now(),
                    totalAmount: total
                };
                localStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error saving cart state:', error);
        }
    }, [enabled]);

    // Check for abandoned cart on page load
    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        try {
            const stored = localStorage.getItem(ABANDONED_CART_KEY);
            if (stored) {
                const data: AbandonedCartData = JSON.parse(stored);
                const delayMs = delayHours * 60 * 60 * 1000;
                const timeSinceAbandonment = Date.now() - data.timestamp;

                // If cart was abandoned more than delayHours ago but less than 30 days
                if (timeSinceAbandonment > delayMs && timeSinceAbandonment < 30 * 24 * 60 * 60 * 1000) {
                    // Check if current cart is empty
                    const currentCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
                    if (currentCart.length === 0 && data.cart.length > 0) {
                        setAbandonedCart(data);
                        setShowRecoveryPrompt(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking abandoned cart:', error);
        }
    }, [enabled, delayHours]);

    // Save cart state when user is about to leave
    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        const handleBeforeUnload = () => {
            saveCartState();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [enabled, saveCartState]);

    // Recover the abandoned cart
    const recoverCart = useCallback(() => {
        if (!abandonedCart) return;

        try {
            localStorage.setItem(CART_KEY, JSON.stringify(abandonedCart.cart));
            localStorage.removeItem(ABANDONED_CART_KEY);
            setShowRecoveryPrompt(false);
            setAbandonedCart(null);

            // Trigger cart update event
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Error recovering cart:', error);
        }
    }, [abandonedCart]);

    // Dismiss the recovery prompt
    const dismissRecovery = useCallback(() => {
        localStorage.removeItem(ABANDONED_CART_KEY);
        setShowRecoveryPrompt(false);
        setAbandonedCart(null);
    }, []);

    // Save customer info when they enter it (for WhatsApp reminder)
    const saveCustomerInfo = useCallback((phone?: string, email?: string, name?: string) => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(ABANDONED_CART_KEY);
            if (stored) {
                const data: AbandonedCartData = JSON.parse(stored);
                if (phone) data.customerPhone = phone;
                if (email) data.customerEmail = email;
                if (name) data.customerName = name;
                localStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error saving customer info:', error);
        }
    }, []);

    return {
        showRecoveryPrompt,
        abandonedCart,
        recoverCart,
        dismissRecovery,
        saveCartState,
        saveCustomerInfo
    };
}
