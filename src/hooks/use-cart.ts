
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, Product, ProductVariant } from '@/lib/types';
import { useToast } from './use-toast';

const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadCart = () => {
            try {
                const storedCart = sessionStorage.getItem('milletyard-cart');
                if (storedCart) {
                    setCart(JSON.parse(storedCart));
                }
            } catch (error) {
                console.error("Failed to parse cart from sessionStorage", error);
                sessionStorage.removeItem('milletyard-cart');
            } finally {
                setIsLoaded(true);
            }
        };

        loadCart();

        const handleCartUpdate = () => {
            loadCart();
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, []);

    const updateSessionStorage = useCallback((newCart: CartItem[]) => {
        try {
            sessionStorage.setItem('milletyard-cart', JSON.stringify(newCart));
            window.dispatchEvent(new Event('cart-updated'));
        } catch (error) {
            console.error("Failed to save cart to sessionStorage", error);
        }
    }, []);

    const addToCart = useCallback((product: Product, quantity: number = 1, selectedVariant?: ProductVariant, selectedOptions?: Record<string, string>) => {
        setCart(prevCart => {
            const priceToUse = selectedVariant ? (selectedVariant.salePrice || selectedVariant.price) : (product.salePrice || product.price);
            // Ensure we don't mutate the original product price permanently in the store context, but for the cart item it needs the correct price.
            // Actually, keep product price as metadata, but maybe CartItem needs an explicit 'price' field? 
            // Existing logic uses product.price. Let's override it in the copy.
            const productWithCorrectPrice = { ...product, price: priceToUse };

            const existingItem = prevCart.find(item =>
                item.product.id === product.id &&
                item.selectedVariant?.id === selectedVariant?.id
            );

            let newCart;
            if (existingItem) {
                newCart = prevCart.map(item =>
                    (item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newCart = [...prevCart, {
                    product: productWithCorrectPrice,
                    quantity,
                    selectedVariant,
                    selectedOptions
                }];
            }
            updateSessionStorage(newCart);
            return newCart;
        });
        toast({
            title: "Added to Cart",
            description: `${product.name} ${selectedVariant ? `(${selectedVariant.title})` : ''} has been added to your cart.`,
        });
    }, [updateSessionStorage, toast]);

    const removeFromCart = useCallback((productId: string) => {
        let productToRemove: Product | undefined;
        setCart(prevCart => {
            productToRemove = prevCart.find(item => item.product.id === productId)?.product;
            const newCart = prevCart.filter(item => item.product.id !== productId);
            updateSessionStorage(newCart);
            return newCart;
        });

        if (productToRemove) {
            toast({
                title: "Removed from Cart",
                description: `${productToRemove.name} has been removed from your cart.`,
                variant: 'destructive'
            });
        }
    }, [updateSessionStorage, toast]);

    const updateQuantity = useCallback((productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(prevCart => {
            const newCart = prevCart.map(item =>
                item.product.id === productId ? { ...item, quantity: newQuantity } : item
            );
            updateSessionStorage(newCart);
            return newCart;
        });
    }, [removeFromCart, updateSessionStorage]);

    const clearCart = useCallback(() => {
        setCart([]);
        sessionStorage.removeItem('milletyard-cart');
        window.dispatchEvent(new Event('cart-updated'));
    }, []);

    const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

    const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);

    return { cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isLoaded };
};

export default useCart;
