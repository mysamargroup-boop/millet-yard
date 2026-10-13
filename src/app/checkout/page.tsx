"use client";

import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Truck,
  ArrowLeft,
  Tag,
  ShoppingBag,
  CheckCircle,
  Loader2,
  Sparkles,
  User,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Zap,
  Phone,
  Mail,
  HelpCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import useCart from "@/hooks/use-cart";
import { useCustomerAuth } from "@/lib/customer-auth";
import { useSettings } from "@/lib/settings-context";
import { createPaymentLink } from "@/lib/payment";
import { API } from "@/config/api";
import { BLUR_DATA_URL } from "@/lib/constants";
import type { OrderItem, Product, SiteSettings } from "@/lib/types";
import confetti from "canvas-confetti";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cart, cartTotal, clearCart, isLoaded: cartLoaded } = useCart();
  const { customer } = useCustomerAuth();
  const { settings } = useSettings();

  const isBuyNow = searchParams.get("buyNow") === "1";
  const [buyNowItem, setBuyNowItem] = useState<{
    product: Product;
    quantity: number;
  } | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"prepaid" | "cod">("prepaid");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Address Book State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Loading & Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Draft lead capture ref
  const lastCapturedPhoneRef = useRef<string>("");

  // Load Buy Now item if present
  useEffect(() => {
    if (isBuyNow) {
      try {
        const raw = sessionStorage.getItem("milletyard_buynow");
        if (raw) {
          setBuyNowItem(JSON.parse(raw));
        }
      } catch (err) {
        console.error("Failed to parse buyNow item:", err);
      }
    }
  }, [isBuyNow]);

  // Autofill customer profile if logged in
  useEffect(() => {
    if (customer) {
      if (customer.name && !customerName) setCustomerName(customer.name);
      if (customer.phone && !customerPhoneNumber) {
        const clean = customer.phone.replace(/\D/g, "").slice(-10);
        setCustomerPhoneNumber(clean);
      }
      if (customer.email && !customerEmail) setCustomerEmail(customer.email);
    }
  }, [customer]);

  // Fetch Saved Addresses
  useEffect(() => {
    if (customer?.phone) {
      fetch(`${API.ADDRESSES}?phone=${customer.phone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: any) => a.isDefault);
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
              setCustomerAddress(defaultAddr.street || defaultAddr.address || "");
              setPincode(defaultAddr.pincode || "");
            }
          }
        })
        .catch(() => {});
    }
  }, [customer?.phone]);

  // 1. Compile Items to Checkout
  const items: OrderItem[] = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [
        {
          id: buyNowItem.product.id,
          name: buyNowItem.product.name,
          quantity: buyNowItem.quantity,
          price: buyNowItem.product.salePrice || buyNowItem.product.price,
          imageUrl: buyNowItem.product.imageUrl,
          imageHint: buyNowItem.product.imageHint || "millet-pack",
        },
      ];
    }
    return cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.salePrice || item.product.price,
      imageUrl: item.product.imageUrl,
      imageHint: item.product.imageHint || "millet-pack",
    }));
  }, [isBuyNow, buyNowItem, cart]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [items]);

  const originalTotal = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      const reg = (buyNowItem.product as any).regularPrice || buyNowItem.product.price;
      return reg * buyNowItem.quantity;
    }
    return cart.reduce((acc, item) => {
      const reg = (item.product as any).regularPrice || item.product.price;
      return acc + reg * item.quantity;
    }, 0);
  }, [isBuyNow, buyNowItem, cart]);

  const freeShippingThreshold = settings?.free_shipping_threshold ?? 499;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 70;

  const codFee = useMemo(() => {
    if (paymentMethod === "cod" && settings?.cod_extra_fee && settings.cod_extra_fee > 0) {
      return Number(settings.cod_extra_fee);
    }
    return 0;
  }, [paymentMethod, settings?.cod_extra_fee]);

  const finalTotal = useMemo(() => {
    const total = subtotal - couponDiscount + shippingCost + codFee;
    return Math.max(0, Math.round(total * 100) / 100);
  }, [subtotal, couponDiscount, shippingCost, codFee]);

  const totalSavings = useMemo(() => {
    const directDiscount = originalTotal > subtotal ? originalTotal - subtotal : 0;
    return directDiscount + couponDiscount;
  }, [originalTotal, subtotal, couponDiscount]);

  // Real-time Draft Lead Capture (Debounce 3s or blur)
  const captureDraftLead = useCallback(
    (sourceType: string = "checkout_abandoned_phone") => {
      if (
        customerPhoneNumber.length === 10 &&
        customerPhoneNumber !== lastCapturedPhoneRef.current
      ) {
        lastCapturedPhoneRef.current = customerPhoneNumber;
        fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customerName?.trim() || "Checkout Visitor",
            phone: customerPhoneNumber,
            source: sourceType,
          }),
        }).catch(() => {});
      }
    },
    [customerPhoneNumber, customerName]
  );

  useEffect(() => {
    if (
      customerPhoneNumber.length === 10 &&
      customerPhoneNumber !== lastCapturedPhoneRef.current
    ) {
      const timer = setTimeout(() => {
        captureDraftLead("checkout_abandoned_phone");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [customerPhoneNumber, captureDraftLead]);

  // Handle Address Select from Saved Book
  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      setCustomerAddress("");
      setPincode("");
      return;
    }
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setCustomerAddress(addr.street || addr.address || "");
      setPincode(addr.pincode || "");
    }
  };

  // Coupon Handlers
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotal,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        toast({
          variant: "destructive",
          title: "Invalid Coupon",
          description: data.error || "The coupon code entered is not valid.",
        });
        return;
      }

      const discount = Number(data.discountAmount || 0);
      if (discount > 0) {
        setCouponDiscount(discount);
        setAppliedCoupon(code);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          zIndex: 9999,
          colors: ["#10b981", "#fbbf24", "#34d399"],
        });
        toast({
          title: "Coupon Applied! 🎉",
          description: `You saved ₹${discount.toFixed(2)} on this order!`,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate coupon code.",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon("");
    setCouponCode("");
    toast({
      title: "Coupon Removed",
      description: "Coupon discount removed from your total.",
    });
  };

  // Order Submission Handler
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerPhoneNumber || customerPhoneNumber.length !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    if (!customerAddress || customerAddress.length < 5) {
      toast({
        variant: "destructive",
        title: "Address Required",
        description: "Please enter your full delivery address.",
      });
      return;
    }

    if (!pincode || pincode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit postal pincode.",
      });
      return;
    }

    setIsSubmitting(true);
    const fullAddress = `${customerAddress}, ${pincode}`;
    const email = customerEmail || `${customerPhoneNumber}@milletyard.com`;

    try {
      // 1. CASH ON DELIVERY (COD)
      if (paymentMethod === "cod") {
        const codOrderId = `COD-${Date.now()}`;
        const codOrderInput = {
          external_order_id: codOrderId,
          customer_name: customerName,
          customer_phone: `91${customerPhoneNumber}`,
          customer_email: email,
          customer_address: fullAddress,
          payment_method: "COD",
          total_amount: finalTotal,
          items,
          couponCode: appliedCoupon || undefined,
          extra_note: extraNote,
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(codOrderInput),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create COD order");
        }

        // Clear cart if standard checkout
        if (!isBuyNow) clearCart();
        sessionStorage.removeItem("milletyard_buynow");

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          zIndex: 9999,
        });

        router.push(`/order-confirmation?order_id=${codOrderId}&status=success`);
        return;
      }

      // 2. PREPAID PAYMENT (CASHFREE / UPI)
      const orderDetails = {
        sku: items[0]?.id || "millet-pack",
        productName: items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
        totalCost: finalTotal,
        customerName,
        customerEmail: email,
        customerPhoneNumber: `91${customerPhoneNumber}`,
        customerAddress: fullAddress,
        advanceAmount: finalTotal,
        items,
        productUrls: [],
      };

      const paymentRes = await createPaymentLink(orderDetails);

      if (!isBuyNow) clearCart();
      sessionStorage.removeItem("milletyard_buynow");

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      // Launch Cashfree SDK if loaded
      if ((window as any).Cashfree && paymentRes.payment_session_id) {
        const cfModeEnv = (
          process.env.NEXT_PUBLIC_CASHFREE_ENV || "SANDBOX"
        ).toUpperCase();
        const cashfree = (window as any).Cashfree({
          mode: cfModeEnv === "PRODUCTION" ? "production" : "sandbox",
        });

        cashfree.checkout({
          paymentSessionId: paymentRes.payment_session_id,
          returnUrl: `${origin}/order-confirmation?order_id={order_id}`,
        });
      } else if (paymentRes.payment_url) {
        // Fallback to hosted payment URL
        window.location.href = paymentRes.payment_url;
      } else {
        router.push(
          `/order-confirmation?order_id=${paymentRes.orderId}&status=pending`
        );
      }
    } catch (err: any) {
      console.error("Checkout submission failed:", err);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description:
          err.message || "Unable to proceed with checkout. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  // If cart is empty and not buy-now, show friendly empty state
  if (cartLoaded && items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-body">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-6 border border-emerald-200">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 mb-2">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-8">
          You haven&apos;t added any traditional superfoods to your cart yet. Explore our unpolished millets and stone-ground flours.
        </p>
        <Button asChild size="lg" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white">
          <Link href="/collections/all">
            <Sparkles className="w-4 h-4 mr-2" /> Explore Native Millets
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-slate-950 font-body pb-20">
      {/* 1. Distraction-Free Checkout Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-stone-200/90 dark:border-stone-800 sticky top-0 z-40 shadow-xs">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/cart" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-emerald-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Cart</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs border border-emerald-200 p-1">
              <Image src="/logo.png" alt="Millet Yard" width={30} height={30} className="object-contain" priority />
            </div>
            <span className="font-headline font-bold text-base sm:text-lg text-emerald-950 dark:text-white tracking-tight">
              Millet Yard
            </span>
          </Link>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>256-Bit SSL</span>
          </div>
        </div>
      </header>

      {/* 2. Mobile Collapsible Order Summary Accordion */}
      <div className="lg:hidden bg-emerald-900 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-emerald-100"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{mobileSummaryOpen ? "Hide order summary" : "Show order summary"}</span>
          {mobileSummaryOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <span className="font-bold text-sm">₹{finalTotal.toFixed(2)}</span>
      </div>

      {mobileSummaryOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border bg-stone-100 shrink-0">
                  <Image src={it.imageUrl} alt={it.name} fill className="object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="56px" />
                  <span className="absolute top-0 right-0 bg-emerald-800 text-white text-[10px] font-bold px-1.5 rounded-bl">
                    {it.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-snug truncate">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground">Qty: {it.quantity}</p>
                </div>
                <span className="text-xs font-bold">₹{(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Mobile Coupon Box */}
          <div className="pt-2 border-t">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg text-emerald-800 text-xs">
                <span className="font-semibold">Coupon: {appliedCoupon} (-₹{couponDiscount.toFixed(2)})</span>
                <button onClick={handleRemoveCoupon} className="text-red-600 font-bold ml-2">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="h-9 text-xs"
                />
                <Button onClick={handleApplyCoupon} size="sm" disabled={isApplyingCoupon} className="h-9 bg-emerald-700 text-white">
                  {isApplyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main 2-Column Desktop Grid */}
      <main className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl">
        <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: 7 Columns (Checkout Form Steps) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Step 1: Contact Information */}
            <Card className="rounded-2xl border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
              <div className="bg-stone-100/70 dark:bg-slate-900/80 px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Contact Information</h3>
                </div>
                {customer && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                    Logged in as {customer.name || customer.phone}
                  </Badge>
                )}
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="checkout-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g., Priya Sharma"
                      required
                      className="rounded-xl h-11 text-sm bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      WhatsApp / Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center">
                      <span className="inline-flex self-stretch items-center px-3 rounded-l-xl border border-r-0 bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-muted-foreground">
                        +91
                      </span>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        value={customerPhoneNumber}
                        onChange={(e) => {
                          const num = e.target.value.replace(/[^0-9]/g, "");
                          if (num.length <= 10) setCustomerPhoneNumber(num);
                        }}
                        onBlur={() => captureDraftLead("checkout_abandoned_phone")}
                        placeholder="10-digit number"
                        required
                        pattern="[0-9]{10}"
                        title="Please enter a 10-digit mobile number"
                        className="rounded-l-none rounded-r-xl h-11 text-sm bg-background font-medium tracking-wide"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Email Address (Optional)</span>
                    <span className="text-[10px] font-normal text-muted-foreground">For digital invoice & tracking</span>
                  </Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g., priya@example.com"
                    className="rounded-xl h-11 text-sm bg-background"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Shipping & Delivery Address */}
            <Card className="rounded-2xl border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
              <div className="bg-stone-100/70 dark:bg-slate-900/80 px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Delivery Address</h3>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" /> Pan-India Express
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                {/* Saved Address Book Selector */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-1.5 pb-2 border-b">
                    <Label className="text-xs font-bold text-slate-700">Select Saved Address</Label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => handleAddressSelect(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium"
                    >
                      <option value="new">+ Add a new address</option>
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.street || addr.address} ({addr.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-address" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    House / Flat No., Apartment, Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="checkout-address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g., Flat 402, Sunshine Apts, Near Green Valley School, MG Road..."
                    required
                    className="rounded-xl min-h-[75px] text-sm bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-pincode" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="checkout-pincode"
                      value={pincode}
                      onChange={(e) => {
                        const num = e.target.value.replace(/[^0-9]/g, "");
                        if (num.length <= 6) setPincode(num);
                      }}
                      placeholder="e.g., 400001"
                      required
                      pattern="[0-9]{6}"
                      title="Please enter a 6-digit postal pincode"
                      className="rounded-xl h-11 text-sm bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-note" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Delivery Note (Optional)
                    </Label>
                    <Input
                      id="checkout-note"
                      value={extraNote}
                      onChange={(e) => setExtraNote(e.target.value)}
                      placeholder="e.g., Leave package at security gate"
                      className="rounded-xl h-11 text-sm bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Payment Method */}
            <Card className="rounded-2xl border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
              <div className="bg-stone-100/70 dark:bg-slate-900/80 px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Payment Method</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">Encrypted & Secure</span>
              </div>
              <CardContent className="p-5 space-y-3">
                {/* Prepaid Option */}
                <label
                  className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "prepaid"
                      ? "border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="prepaid"
                      checked={paymentMethod === "prepaid"}
                      onChange={() => setPaymentMethod("prepaid")}
                      className="mt-1 h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Online Payment (UPI, Cards, NetBanking)</span>
                        <Badge className="bg-emerald-700 text-white text-[10px] px-1.5 py-0">Recommended</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Google Pay, PhonePe, Paytm, Credit/Debit Cards, Net Banking via Cashfree.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                </label>

                {/* COD Option */}
                {settings?.cod_enabled && (
                  <label
                    className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="mt-1 h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">Cash on Delivery (COD)</span>
                          {codFee > 0 && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              +₹{codFee} handling
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pay with cash or UPI QR code at your doorstep upon delivery.
                        </p>
                      </div>
                    </div>
                    <Truck className="h-5 w-5 text-stone-500 shrink-0 mt-0.5" />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Desktop Action CTA Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:to-teal-950 text-white font-bold text-base sm:text-lg shadow-xl shadow-emerald-950/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 text-emerald-300" />
                    <span>Complete Order • ₹{finalTotal.toFixed(2)}</span>
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> 100% Native Millets
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Fast Express Shipping
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Easy Tracking
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: 5 Columns (Sticky Order Summary) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-6">
            <Card className="rounded-2xl border-stone-200/90 dark:border-stone-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-700" /> Order Summary
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {items.reduce((acc, it) => acc + it.quantity, 0)} Items
                </span>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Items List */}
                <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 shrink-0">
                        <Image src={it.imageUrl} alt={it.name} fill className="object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="64px" />
                        <span className="absolute top-0 right-0 bg-emerald-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                          {it.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs leading-snug truncate text-foreground">{it.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Qty: {it.quantity} × ₹{it.price.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground shrink-0">
                        ₹{(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                  <Label htmlFor="desktop-coupon" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Have a Coupon Code?
                  </Label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> {appliedCoupon} applied (-₹{couponDiscount.toFixed(2)})
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 font-bold text-[11px] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="desktop-coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="e.g., MILLET10"
                        className="h-10 text-xs uppercase font-mono tracking-wider"
                      />
                      <Button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="h-10 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                      >
                        {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs sm:text-sm">
                  {originalTotal > subtotal && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Original Price:</span>
                      <span className="line-through">₹{originalTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>Shipping:</span>
                    <span className="font-semibold">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
                      ) : (
                        `₹${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Coupon Discount:</span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {codFee > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>COD Handling Fee:</span>
                      <span>+₹{codFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-between items-baseline text-base font-bold text-foreground">
                    <span>Grand Total <span className="text-xs font-normal text-muted-foreground">(incl. GST)</span>:</span>
                    <span className="text-xl font-headline text-emerald-900 dark:text-emerald-300">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 py-2 px-3 rounded-xl mt-2 text-xs font-bold border border-emerald-200/60">
                      <span>🎉 You are saving ₹{totalSavings.toFixed(2)} on this order!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trust Assurance Panel */}
            <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-slate-900/40 border border-stone-200/70 dark:border-stone-800 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Millet Yard Quality Guarantee</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Directly harvested from certified tribal farmer clusters. Unpolished, 0% chemicals, stone-milled for complete fiber retention.
              </p>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Script id="cashfree-js" src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading Checkout...</span>
            </div>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </>
  );
}
