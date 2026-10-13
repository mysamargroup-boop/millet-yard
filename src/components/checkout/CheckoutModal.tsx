
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, Tag, X, FileText, Zap, Phone, Truck, Info, IndianRupee, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { API } from '@/config/api';
import Link from 'next/link';
import type { OrderItem, Product, SiteSettings } from "@/lib/types";
import { BLUR_DATA_URL } from '@/lib/constants';
import { createPaymentLink } from '@/lib/payment';

// Define type locally since we removed the import
interface WhatsAppCheckoutInput {
  productName: string;
  sku?: string;
  productDescription?: string;
  originalPrice?: number;
  productPrice: number;
  shippingCost: number;
  totalCost: number;
  quantity: number;
  productUrls?: string[];
  products?: OrderItem[];
  discountPercentage?: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutInput: Omit<WhatsAppCheckoutInput, 'customerName' | 'customerPhoneNumber' | 'customerAddress' | 'extraNote'> & { productImages?: string[]; sku?: string, products?: OrderItem[], uploadProductIds?: string[]; discountPercentage?: number } | null;
  checkoutMode: 'whatsapp' | 'payment';
}

const OrderSummary = ({
  checkoutInput,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  couponDiscount,
  finalTotal,
  advanceAmount,
  advancePercent,
  mode,
}: {
  checkoutInput: CheckoutModalProps['checkoutInput'];
  couponCode: string;
  setCouponCode: (value: string) => void;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  couponDiscount: number;
  finalTotal: number;
  advanceAmount: number;
  advancePercent: number;
  mode: 'whatsapp' | 'payment';
}) => {
  if (!checkoutInput) return null;

  const supportPhoneNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER;

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
      <h4 className="font-semibold text-lg flex items-center gap-2">
        Order Summary
      </h4>
      {checkoutInput.productImages && checkoutInput.productImages.length > 0 && (
        <div className="flex gap-2">
          {checkoutInput.productImages.slice(0, 3).map((img, i) => (
            <Image key={i} src={img} alt={checkoutInput.productName} width={64} height={64} className="rounded-md object-cover" />
          ))}
          {checkoutInput.productImages.length > 3 && <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">+{checkoutInput.productImages.length - 3} more</div>}
        </div>
      )}
      <div className="flex justify-between items-start gap-3">
        <p className="font-semibold text-sm leading-snug">{checkoutInput.productName}</p>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 font-medium">Qty: {checkoutInput.quantity}</span>
      </div>
      <div className="text-sm space-y-1 text-muted-foreground">
        {checkoutInput.originalPrice && checkoutInput.originalPrice > checkoutInput.productPrice && (
          <div className="flex justify-between">
            <span>Original Price:</span>
            <span className="line-through text-muted-foreground">₹{checkoutInput.originalPrice.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between"><span>Subtotal:</span> <span>₹{checkoutInput.productPrice.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Shipping:</span> <span>{checkoutInput.shippingCost > 0 ? `₹${checkoutInput.shippingCost.toFixed(2)}` : 'Free'}</span></div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon Discount:</span>
            <span>-₹{couponDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-foreground pt-2 border-t"><span>Total <span className="text-sm font-normal text-muted-foreground">(incl. GST)</span>:</span> <span>₹{finalTotal.toFixed(2)}</span></div>

        {/* You Saved Badge */}
        {(checkoutInput.originalPrice && checkoutInput.originalPrice > checkoutInput.productPrice || couponDiscount > 0) && (
          <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 py-2 px-3 rounded-lg mt-2">
            <span className="text-lg">🎉</span>
            <span className="font-semibold text-sm">
              You saved ₹{((checkoutInput.originalPrice || checkoutInput.productPrice) - checkoutInput.productPrice + couponDiscount).toFixed(2)}!
            </span>
          </div>
        )}

        {mode === 'payment' && (
          <div className="flex justify-between font-bold text-primary pt-2 border-t">
            <span>Amount Payable (Full):</span>
            <span>₹{advanceAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="coupon" className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Have a Coupon Code?
          </Label>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Special Discounts Available
          </span>
        </div>
        <div className="flex space-x-2">
          <Input
            id="coupon"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={couponDiscount > 0}
            maxLength={20}
            className="font-mono uppercase font-bold"
          />
          {couponDiscount > 0 ? (
            <Button type="button" variant="destructive" onClick={handleRemoveCoupon} size="sm">
              <X className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          ) : (
            <Button
              id="apply-coupon-btn"
              type="button"
              onClick={handleApplyCoupon}
              disabled={!couponCode}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Tag className="mr-1.5 h-4 w-4" /> Apply
            </Button>
          )}
        </div>

        {/* 1-Click Available Coupon Badges */}
        {couponDiscount === 0 && (
          <div className="pt-1 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Tap to apply coupon:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: 'MILLET10', label: '10% OFF' },
                { code: 'FIRST50', label: '₹50 OFF' },
                { code: 'SHREEANNA', label: '15% OFF' },
                { code: 'HEALTH100', label: '₹100 OFF' },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCouponCode(c.code);
                    setTimeout(() => {
                      const btn = document.getElementById('apply-coupon-btn');
                      if (btn) btn.click();
                    }, 50);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/60 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="text-amber-600">🏷️</span>
                  <span>{c.code}</span>
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">({c.label})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 mt-3">
        <Truck className="h-6 w-6" />
        <div>
          <p className="font-semibold text-sm">Estimated Delivery: 7-15 days</p>
          {supportPhoneNumber && <p className="text-xs">For details, call <a href={`tel:${supportPhoneNumber}`} className="font-bold">{supportPhoneNumber}</a>.</p>}
        </div>
      </div>
      <div className="text-center text-[11px] text-muted-foreground pt-2 space-x-3">
        <Link href="/pricing" target="_blank" className="hover:underline">Pricing Policy</Link>
        <Link href="/shipping" target="_blank" className="hover:underline">Shipping</Link>
        <Link href="/returns-and-refunds" target="_blank" className="hover:underline">Returns & Refunds</Link>
      </div>
    </div>
  );
};


import { useCustomerAuth } from '@/lib/customer-auth';
import CustomerAuthModal from '@/components/auth/CustomerAuthModal';

const CheckoutModal = ({ isOpen, onOpenChange, checkoutInput, checkoutMode }: CheckoutModalProps) => {
  const [step, setStep] = useState<'form' | 'loading' | 'confirmation'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({});
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');

  // Address Book State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  const { customer } = useCustomerAuth();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  const baseTotal = checkoutInput?.totalCost ?? 0;

  // Add COD fee if COD is selected
  const codFee = useMemo(() => {
    if (paymentMethod === 'cod' && siteSettings.cod_extra_fee && siteSettings.cod_extra_fee > 0) {
      return siteSettings.cod_extra_fee;
    }
    return 0;
  }, [paymentMethod, siteSettings.cod_extra_fee]);

  const finalTotal = useMemo(() => {
    const total = baseTotal - couponDiscount + codFee;
    return total < 0 ? 0 : total;
  }, [baseTotal, couponDiscount, codFee]);

  const advancePercent = 0;

  const advanceAmount = useMemo(() => {
    const amount = checkoutMode === 'payment' ? finalTotal : 0;
    return Math.max(1, parseFloat(amount.toFixed(2)));
  }, [finalTotal, checkoutMode]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('form');
        // Don't clear fields if logged in to preserve potentially autofilled data (future feature)
        // But for now, reset checks out.
        // Actually, if logged in, we might want to prefill.
        if (!customer) {
          setCustomerName('');
          setCustomerPhoneNumber('');
          setCustomerAddress('');
          setPincode('');
          setCustomerEmail('');
        }
        setExtraNote('');
        setCouponCode('');
        setCouponDiscount(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, customer]);

  // Real-time Draft Lead Capture (Captures phone 3 seconds after entering 10 digits or on blur)
  const lastCapturedPhoneRef = useRef<string>('');
  const captureDraftLead = useCallback((sourceType: string = 'checkout_abandoned_phone') => {
    if (customerPhoneNumber.length === 10 && customerPhoneNumber !== lastCapturedPhoneRef.current) {
      lastCapturedPhoneRef.current = customerPhoneNumber;
      fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName?.trim() || 'Checkout Visitor',
          phone: customerPhoneNumber,
          source: sourceType
        }),
      }).catch(() => {});
    }
  }, [customerPhoneNumber, customerName]);

  useEffect(() => {
    if (customerPhoneNumber.length === 10 && customerPhoneNumber !== lastCapturedPhoneRef.current) {
      const timer = setTimeout(() => {
        captureDraftLead('checkout_abandoned_phone');
      }, 3000); // 3-second debounce
      return () => clearTimeout(timer);
    }
  }, [customerPhoneNumber, captureDraftLead]);



  // Fetch Saved Addresses
  useEffect(() => {
    if (customer?.phone && isOpen) {
      fetch(`${API.ADDRESSES}?phone=${customer.phone}`)
        .then(res => res.json())
        .then(data => {
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            // Optional: Select default address automatically
            const defaultAddress = data.addresses.find((a: any) => a.isDefault);
            if (defaultAddress) {
              handleAddressSelect(defaultAddress.id, data.addresses);
            }
          }
        })
        .catch(err => console.error("Failed to load addresses", err));
    }
  }, [customer, isOpen]);

  const handleAddressSelect = (addressId: string, list = savedAddresses) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      setCustomerAddress('');
      setPincode('');
      return;
    }
    const addr = list.find((a: any) => a.id === addressId);
    if (addr) {
      setCustomerAddress(addr.address);
      setPincode(addr.pincode);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return;
        const data = await res.json();
        if (data) setSiteSettings(data as SiteSettings);
      } catch { }
    })();
  }, []);

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast({
        variant: "destructive",
        title: "Invalid Coupon",
        description: "Please enter a valid coupon code.",
      });
      return;
    }
    try {
      // Check env toggle for API source
      const { getCouponValidationMethod } = await import('@/config/api');
      const validationMethod = getCouponValidationMethod();

      let result: { discountAmount: number; message?: string; error?: string };

      if (validationMethod === 'api-route') {
        // VPS mode: Use Next.js API route
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code,
            subtotal: checkoutInput?.productPrice || 0
          }),
        });
        const data = await res.json().catch(() => ({}));
        result = {
          discountAmount: Number(data.discountAmount || 0),
          message: data.message,
          error: !res.ok ? (data.error || 'Invalid coupon') : undefined
        };
      } else {
        // Vercel mode: Use Supabase RPC directly (faster, no API route needed)
        const { validateCouponDirect } = await import('@/lib/supabase');
        result = await validateCouponDirect(code, checkoutInput?.productPrice || 0);
      }

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Invalid Coupon",
          description: result.error || "The coupon code you entered is not valid.",
        });
        return;
      }

      const discountAmount = Number(result.discountAmount || 0);
      if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Coupon",
          description: "The coupon could not be applied.",
        });
        return;
      }
      setCouponDiscount(discountAmount);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 10000,
        colors: ['#ffd700', '#ffeb3b', '#fff59d']
      });

      toast({
        title: "Coupon Applied!",
        description: result.message || `You've received a discount of ₹${discountAmount.toFixed(2)}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Invalid Coupon",
        description: error?.message || "Failed to validate coupon. Please try again.",
      });
    }
  }, [couponCode, checkoutInput, toast]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponDiscount(0);
    setCouponCode('');
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order."
    })
  }, [toast]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutInput) return;

    setStep('loading');

    const fullAddress = `${customerAddress}, ${pincode}`;

    const email = customerEmail || `${customerPhoneNumber}@milletyard.com`;

    const orderDetails = {
      sku: checkoutInput.sku,
      productName: checkoutInput.productName,
      totalCost: finalTotal,
      customerName,
      customerEmail: email,
      customerPhoneNumber: `91${customerPhoneNumber}`,
      customerAddress: fullAddress,
      extraNote,
      quantity: checkoutInput.quantity,
      advanceAmount,
      items: checkoutInput.products || [],
    };

    try {
      // Handle COD orders - create order directly without payment gateway
      if (checkoutMode === 'payment' && paymentMethod === 'cod') {
        const codOrderId = `COD-${Date.now()}`;
        const codOrderInput = {
          external_order_id: codOrderId,
          customer_name: customerName,
          customer_phone: `91${customerPhoneNumber}`,
          customer_email: email,
          customer_address: fullAddress,
          payment_method: 'COD',
          total_amount: finalTotal,
          items: checkoutInput.products || [],
          couponCode: couponCode || undefined,
          extra_note: extraNote,
        };

        const orderCreateUrl = API.ORDER_CREATE_URL || '/api/orders';
        const codRes = await fetch(orderCreateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(codOrderInput),
        });
        if (!codRes.ok) {
          const errData = await codRes.json().catch(() => ({}));
          throw new Error((errData as any)?.error || 'Failed to create order');
        }

        try {
          localStorage.setItem(`order_${codOrderId}`, JSON.stringify({ ...orderDetails, orderId: codOrderId, amount: finalTotal, paymentMethod: 'COD' }));
        } catch { }

        audioRef.current?.play();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 10000,
        });

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        window.location.href = `${origin}/order-confirmation?order_id=${codOrderId}`;
        return;
      }

      if (checkoutMode === 'payment' && paymentMethod === 'prepaid') {
        const paymentInput = {
          ...orderDetails,
          subtotal: checkoutInput.productPrice,
          shippingCost: checkoutInput.shippingCost,
          productUrls: checkoutInput.productUrls || [],
          productDescription: checkoutInput.productDescription,
          originalPrice: checkoutInput.originalPrice,
          productPrice: checkoutInput.productPrice,
          couponDiscount,
          paymentMethod: 'prepaid',
          // Ensure items is populated for single product checkout if empty
          items: (checkoutInput.products && checkoutInput.products.length > 0) ? checkoutInput.products : [{
            id: checkoutInput.sku || 'sku-unknown',
            name: checkoutInput.productName,
            quantity: checkoutInput.quantity,
            price: checkoutInput.productPrice,
            imageUrl: checkoutInput.productImages?.[0] || '',
            imageHint: 'single-checkout'
          }]
        };
        const res = await createPaymentLink(paymentInput);

        try {
          localStorage.setItem(`order_${res.orderId}`, JSON.stringify({ ...orderDetails, orderId: res.orderId, amount: advanceAmount }));
        } catch { }

        const origin = (process.env.NEXT_PUBLIC_BASE_URL || '').trim() || (typeof window !== 'undefined' ? window.location.origin : '');
        const composeReturnUrl = (orderIdParam: string) => {
          return `${origin}/order-confirmation?order_id=${orderIdParam}`;
        };

        const getPaymentsUrl = async (orderIdParam: string) => {
          try {
            const resStatus = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderIdParam)}`);
            if (!resStatus.ok) return null;
            const sdata = await resStatus.json();
            return (sdata as any)?.payments?.url || (sdata as any)?.payments_url || null;
          } catch { }
          return null;
        };

        if ((window as any).Cashfree) {
          const cfModeEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toUpperCase();
          const cashfree = (window as any).Cashfree({
            mode: cfModeEnv === 'PRODUCTION' ? 'production' : 'sandbox'
          });

          cashfree.checkout({
            paymentSessionId: res.payment_session_id,
            returnUrl: `${origin}/order-confirmation?order_id={order_id}`
          })
            .catch(async (err: any) => {
              console.error('Cashfree SDK checkout failed:', err);
              const returnUrl = composeReturnUrl(res.orderId);
              let hostedUrl = res.payment_url;
              if (!hostedUrl) hostedUrl = await getPaymentsUrl(res.orderId);
              if (hostedUrl) {
                const joiner = hostedUrl.includes('?') ? '&' : '?';
                const redirectUrl = `${hostedUrl}${joiner}return_url=${encodeURIComponent(returnUrl)}`;
                window.location.href = redirectUrl;
              } else {
                toast({
                  variant: "destructive",
                  title: "Payment Failed",
                  description: "Could not start checkout. Please try again.",
                });
                setStep('form');
              }
            });

          setTimeout(async () => {
            if (document.hidden) return;
            if (typeof window !== 'undefined') {
              const returnUrl = composeReturnUrl(res.orderId);
              let hostedUrl = res.payment_url;
              if (!hostedUrl) hostedUrl = await getPaymentsUrl(res.orderId);
              if (hostedUrl) {
                const joiner = hostedUrl.includes('?') ? '&' : '?';
                const redirectUrl = `${hostedUrl}${joiner}return_url=${encodeURIComponent(returnUrl)}`;
                window.location.href = redirectUrl;
              }
            }
          }, 8000);
        } else {
          const returnUrl = composeReturnUrl(res.orderId);
          let hostedUrl = res.payment_url;
          if (!hostedUrl) hostedUrl = await getPaymentsUrl(res.orderId);
          if (hostedUrl) {
            const joiner = hostedUrl.includes('?') ? '&' : '?';
            const redirectUrl = `${hostedUrl}${joiner}return_url=${encodeURIComponent(returnUrl)}`;
            window.location.href = redirectUrl;
          } else {
            toast({
              variant: "destructive",
              title: "Payment Failed",
              description: "Could not start checkout. Please try again.",
            });
            setStep('form');
          }
        }

      } else {
        // For WhatsApp checkout, create order without payment
        const waOrderId = `WA-${Date.now()}`;
        const waOrderInput = {
          external_order_id: waOrderId,
          customer_name: customerName,
          customer_phone: `91${customerPhoneNumber}`,
          customer_email: email,
          customer_address: fullAddress,
          payment_method: 'COD',
          total_amount: 0,
          items: checkoutInput.products || [],
        };

        const orderCreateUrl = API.ORDER_CREATE_URL || '/api/orders';
        const waRes = await fetch(orderCreateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(waOrderInput),
        });
        if (!waRes.ok) {
          const errData = await waRes.json().catch(() => ({}));
          throw new Error((errData as any)?.error || 'Failed to create order');
        }

        audioRef.current?.play();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 10000,
        });
        setStep('confirmation');
      }

    } catch (error: any) {
      console.error('Order submission failed:', error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
      setStep('form');
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
  };

  const renderContent = () => {
    if (siteSettings?.customer_login_enabled && !customer) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center min-h-[300px]">
          <div className="rounded-full bg-primary/10 p-4">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Login Required</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Please login with your phone number to complete your purchase and track your order easily.
            </p>
          </div>
          <CustomerAuthModal trigger={
            <Button size="lg" className="gap-2">
              <Phone className="h-4 w-4" />
              Login with WhatsApp
            </Button>
          } />
          <p className="text-xs text-muted-foreground">
            We use your phone number for secure login and order updates.
          </p>
        </div>
      );
    }

    switch (step) {
      case 'form':
        return (
          <form onSubmit={handleOrderSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-12 md:gap-6 lg:gap-8 items-start">
              <div className="mb-4 md:mb-0 md:col-span-5">
                <OrderSummary
                  checkoutInput={checkoutInput}
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  handleApplyCoupon={handleApplyCoupon}
                  handleRemoveCoupon={handleRemoveCoupon}
                  couponDiscount={couponDiscount}
                  finalTotal={finalTotal}
                  advanceAmount={advanceAmount}
                  advancePercent={advancePercent}
                  mode={checkoutMode}
                />
              </div>
              <div className="grid gap-4 py-4 md:py-0 md:col-span-7">

                {/* Saved Address Selection */}
                {savedAddresses.length > 0 && (
                  <div className="p-3 border rounded-md bg-muted/20">
                    <Label className="mb-2 block">Saved Addresses</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedAddressId}
                      onChange={(e) => handleAddressSelect(e.target.value)}
                    >
                      <option value="new">-- Add New Address --</option>
                      {savedAddresses.map((addr: any) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.name} - {addr.pincode}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <div className="flex items-center">
                    <span className="inline-flex self-stretch items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">+91</span>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhoneNumber}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        if (numericValue.length <= 10) {
                          setCustomerPhoneNumber(numericValue);
                        }
                      }}
                      onBlur={() => captureDraftLead('checkout_abandoned_phone')}
                      placeholder="e.g. 9876543210"
                      required
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit phone number"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g., priya@example.com"
                  />
                  <p className="text-xs text-muted-foreground">If left blank, an email like &apos;1234567890@milletyard.com&apos; will be used.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address</Label>
                  <Textarea
                    id="address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. 123, Rose Villa, MG Road..."
                    required
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      if (numericValue.length <= 6) {
                        setPincode(numericValue);
                      }
                    }}
                    placeholder="e.g. 400001"
                    required
                    pattern="[0-9]{6}"
                    title="Please enter a 6-digit pincode"
                  />
                </div>

                {/* Payment Method Selection - only show in payment mode */}
                {checkoutMode === 'payment' && (
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <Label className="text-base font-semibold">Payment Method</Label>
                    <div className={`grid gap-3 ${siteSettings.cod_enabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'prepaid'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                          }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="prepaid"
                          checked={paymentMethod === 'prepaid'}
                          onChange={() => setPaymentMethod('prepaid')}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'prepaid' ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                          {paymentMethod === 'prepaid' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <span className="font-medium">Pay Now</span>
                          <p className="text-xs text-muted-foreground">Online Payment</p>
                        </div>
                      </label>
                      {/* COD option - only show if enabled in admin */}
                      {siteSettings.cod_enabled && (
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cod'
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-muted-foreground/30'
                            } ${(siteSettings.cod_min_order_amount && finalTotal < siteSettings.cod_min_order_amount) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={(e) => {
                            if (siteSettings.cod_min_order_amount && finalTotal < siteSettings.cod_min_order_amount) {
                              e.preventDefault();
                              toast({
                                variant: "destructive",
                                title: "COD Not Available",
                                description: `Minimum order ₹${siteSettings.cod_min_order_amount} required for COD.`,
                              });
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => {
                              if (!siteSettings.cod_min_order_amount || finalTotal >= siteSettings.cod_min_order_amount) {
                                setPaymentMethod('cod');
                              }
                            }}
                            disabled={siteSettings.cod_min_order_amount ? finalTotal < siteSettings.cod_min_order_amount : false}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'
                            }`}>
                            {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <span className="font-medium">COD</span>
                            <p className="text-xs text-muted-foreground">
                              Cash on Delivery
                              {siteSettings.cod_extra_fee && siteSettings.cod_extra_fee > 0 && (
                                <span className="text-orange-600"> (+₹{siteSettings.cod_extra_fee})</span>
                              )}
                            </p>
                            {siteSettings.cod_min_order_amount && finalTotal < siteSettings.cod_min_order_amount && (
                              <p className="text-xs text-red-500">Min order: ₹{siteSettings.cod_min_order_amount}</p>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="extra-note">Extra Note (Optional)</Label>
                  <Textarea
                    id="extra-note"
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="e.g. Leave package at the front door."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              {checkoutMode === 'payment' ? (
                <Button type="submit" className="w-full bg-gradient-to-r from-green-700 to-green-900 hover:from-green-800 hover:to-green-900 text-white">
                  <span className="flex items-center gap-2">
                    {/* Gateway-specific logos */}
                    {(siteSettings?.payment_gateway === 'CASHFREE' || !siteSettings?.payment_gateway) && (
                      <img src="https://cashfreelogo.cashfree.com/cashfreepayments/logosvgs/Group-cashfree.svg" alt="Cashfree" className="h-5 w-auto brightness-0 invert" />
                    )}
                    {siteSettings?.payment_gateway === 'RAZORPAY' && (
                      <img src="https://cdn.razorpay.com/logo.svg" alt="Razorpay" className="h-5 w-auto brightness-0 invert" />
                    )}
                    {siteSettings?.payment_gateway === 'STRIPE' && (
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 w-auto brightness-0 invert" />
                    )}
                    {siteSettings?.payment_gateway === 'PAYU' && (
                      <img src="https://www.payumoney.com/images/payu-money-logo.png" alt="PayU" className="h-5 w-auto brightness-0 invert" />
                    )}
                    <span>Pay ₹{advanceAmount.toFixed(2)}</span>
                  </span>
                </Button>
              ) : (
                <Button type="submit" className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Confirm on WhatsApp
                </Button>
              )}
            </DialogFooter>
          </form>
        );
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg">Processing your order...</p>
          </div>
        );
      case 'confirmation':
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold font-headline mb-2">Order Placed Successfully!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. You will receive a confirmation on WhatsApp shortly.
            </p>
            <Button onClick={() => onOpenChange(false)} asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        );
    }
  };

  const getTitle = () => {
    if (siteSettings?.customer_login_enabled && !customer) return 'Login Required';
    if (step === 'confirmation') return 'Order Confirmed!';
    return checkoutMode === 'payment' ? 'Pay at Checkout' : 'Confirm Order via WhatsApp';
  }

  const getDescription = () => {
    if (siteSettings?.customer_login_enabled && !customer) return 'You need to be logged in to proceed.';
    if (step === 'loading') return 'Please wait while we process your request.';
    if (step === 'confirmation') return 'Thank you for your order!';
    if (checkoutMode === 'payment') return advancePercent > 0 ? `Confirm your order by paying a ${advancePercent}% advance. The remaining balance will be settled before dispatch.` : 'Confirm your order by paying the full amount at checkout.';
    return 'Enter your details to confirm your order. You will receive a confirmation message on WhatsApp.';
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[96vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className='font-headline'>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        {renderContent()}
        <Script id="cashfree-js" src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
        <audio ref={audioRef} src="https://cdn.freesound.org/previews/270/270319_5122242-lq.mp3" preload="auto" />
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;


