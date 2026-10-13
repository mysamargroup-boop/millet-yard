
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingCart, Loader2, FileText, ArrowLeft, Lock, Heart } from "lucide-react";
import useCart from "@/hooks/use-cart";
import useWishlist from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CheckoutModal from "@/components/checkout/CheckoutModal";
import type { WhatsAppCheckoutInput } from "@/ai/flows/whatsapp-checkout-message";
import { BLUR_DATA_URL } from "@/lib/constants";
import type { OrderItem, SiteSettings } from "@/lib/types";
import { getSiteSettings } from "@/lib/data-async";
import { slugify } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, cartTotal, isLoaded } = useCart();
  const { addToWishlist } = useWishlist();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isClient, setIsClient] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  useEffect(() => {
    setIsClient(true);
    getSiteSettings().then(setSettings);
  }, []);

  if (!isLoaded || !settings || !isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl font-bold animate-pulse bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Loading your cart...</p>
      </div>
    );
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };

  // 💖 Move product from Cart to Wishlist
  const handleMoveToWishlist = (product: any) => {
    addToWishlist(product);
    removeFromCart(product.id);
    toast({
      title: "Moved to Wishlist! ❤️",
      description: `${product.name} moved from cart to your wishlist.`,
    });
  };

  const handlePaymentCheckout = () => {
    router.push('/checkout');
  };

  const totalSavings = cart.reduce((acc, item) => {
    const regularPrice = (item.product as any).regularPrice || item.product.price;
    return regularPrice > item.product.price
      ? acc + (regularPrice - item.product.price) * item.quantity
      : acc;
  }, 0);

  const originalCartTotal = cart.reduce((total, item) => {
    const originalPrice = (item.product as any).regularPrice || item.product.price;
    return total + originalPrice * item.quantity;
  }, 0);

  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const shippingCost = cartTotal > freeShippingThreshold ? 0 : 99;
  const totalCost = cartTotal + shippingCost;

  const productsForCheckout: OrderItem[] = cart.map(item => ({
    id: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price,
    imageUrl: item.product.imageUrl,
    imageHint: item.product.imageHint,
  }))

  const checkoutInput: Omit<WhatsAppCheckoutInput, 'customerName' | 'customerPhoneNumber' | 'customerAddress' | 'extraNote'> & { productImages?: string[], products: OrderItem[] } | null = cart.length > 0 ? {
    productName: cart.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
    productDescription: `Total order value: ₹${totalCost.toFixed(2)}`,
    originalPrice: originalCartTotal,
    productPrice: cartTotal,
    discountPercentage: originalCartTotal > cartTotal ? ((originalCartTotal - cartTotal) / originalCartTotal) * 100 : 0,
    quantity: cart.reduce((acc, item) => acc + item.quantity, 0),
    shippingCost: shippingCost,
    totalCost: totalCost,
    productImages: cart.map(item => item.product.imageUrl),
    productUrls: baseUrl ? cart.map(item => `${baseUrl}/collections/${slugify(item.product.category)}/${slugify(item.product.name)}`) : [],
    products: productsForCheckout,
  } : null;

  return (
    <>
      <div className="container mx-auto px-4 py-12 pb-32 md:pb-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-4xl font-headline font-bold text-center">Your Cart</h1>
          <div className="w-24"></div>
        </div>
        {cart.length === 0 ? (
          <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-muted-foreground">Looks like you haven't added any gifts to your cart yet.</p>
            <Button asChild className="mt-6">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(({ product, quantity }) => {
                const productUrl = `/collections/${slugify(product.category)}/${slugify(product.name)}`;
                const regularPrice = (product as any).regularPrice || product.price;
                const hasDiscount = regularPrice > product.price;
                const discountPercent = hasDiscount ? Math.round((1 - product.price / regularPrice) * 100) : 0;
                const savedAmount = hasDiscount ? (regularPrice - product.price) * quantity : 0;

                return (
                  <Card key={product.id} className="flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center">
                      <Link href={productUrl} className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={product.imageHint} placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="(max-width: 640px) 20vw, 96px" />
                        {hasDiscount && (
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                            {discountPercent}% OFF
                          </div>
                        )}
                      </Link>
                      <div className="ml-4 flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                        <div className="sm:col-span-1">
                          <h3 className="font-semibold text-lg leading-tight hover:text-primary">
                            <Link href={productUrl}>{product.name}</Link>
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            <p className="text-muted-foreground sm:hidden">₹{product.price.toFixed(2)}</p>
                            {hasDiscount && (
                              <p className="line-through text-muted-foreground text-xs sm:hidden">₹{regularPrice.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="font-semibold text-lg sm:w-24 sm:text-right">₹{(product.price * quantity).toFixed(2)}</p>
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                          {/* Mobile Action Buttons: Move to Wishlist & Remove */}
                          <div className="flex items-center gap-1.5 sm:hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-pink-600 gap-1 px-2.5 h-8 rounded-lg"
                              onClick={() => handleMoveToWishlist(product)}
                              title="Move to Wishlist"
                            >
                              <Heart className="h-3.5 w-3.5 text-pink-500" />
                              <span>Save to Wishlist</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(product.id)}
                              title="Remove from Cart"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* Desktop Action Buttons: Move to Wishlist & Remove */}
                      <div className="hidden sm:flex items-center gap-1.5 ml-3 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-full transition-colors cursor-pointer"
                          onClick={() => handleMoveToWishlist(product)}
                          title="Move to Wishlist"
                        >
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="sr-only">Move to Wishlist</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
                          onClick={() => removeFromCart(product.id)}
                          title="Remove from Cart"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </div>
                    {hasDiscount && (
                      <div className="mt-3 pt-3 border-t border-dashed">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground">You Saved: </span>
                          <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ₹{savedAmount.toFixed(0)}
                          </span>
                        </p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Savings</span>
                    <span className="text-green-600 font-medium">-₹{totalSavings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total <span className="text-sm font-normal text-muted-foreground">(incl. GST)</span></span>
                    <span>₹{totalCost.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button className="w-full bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-900 hover:to-emerald-950 text-white shadow-md rounded-xl font-bold" size="lg" onClick={handlePaymentCheckout}>
                    <Lock className="mr-2 h-4 w-4" /> Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4 pb-2 z-40 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col gap-3">
            {totalSavings > 0 && (
              <div className="text-center">
                <span className="text-sm font-medium text-muted-foreground">You Saved </span>
                <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Total ₹{totalSavings.toFixed(0)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">₹{totalCost.toFixed(0)}</p>
              </div>
              <Button className="flex-1 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-xl font-bold" size="lg" onClick={handlePaymentCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {checkoutInput && <CheckoutModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        checkoutInput={checkoutInput}
        checkoutMode={checkoutMode}
      />}
    </>
  );
}
