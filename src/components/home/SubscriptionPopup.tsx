
'use client';

import { useState, useEffect } from 'react';
import { Mail, Gift, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { handleSubscription } from '@/ai/flows/handle-subscription';

const SubscriptionPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const { toast } = useToast();

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('hasSeenSubscriptionPopup');
    if (hasSeenPopup) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      if (scrollPosition > (documentHeight - windowHeight) * 0.3) {
        setIsOpen(true);
        sessionStorage.setItem('hasSeenSubscriptionPopup', 'true');
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const fullPhoneNumber = `91${whatsapp}`;

    try {
      await handleSubscription({ customerName: name, customerPhoneNumber: fullPhoneNumber });
      try {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            phone: fullPhoneNumber,
            source: 'popup',
          }),
        });
      } catch { }

      setIsSuccess(true);
      setTimeout(() => setIsOpen(false), 3000);

      toast({
        title: "Subscribed!",
        description: "You're now signed up for exclusive offers. Thank you!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pb-24 md:pb-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl shadow-emerald-950/60 border border-emerald-500/30 m-4 animate-in zoom-in-95 duration-300 pt-10 pb-6 px-6 sm:px-8">

        {/* Floating Cutout Logo Badge */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-500 opacity-80 blur-sm animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-white border-2 border-amber-400 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Millet Yard Authentic Shree Anna Millets"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 z-20 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="pt-4 flex flex-col items-center text-center relative z-10">
          {isSuccess ? (
            <div className="animate-in fade-in zoom-in duration-300 py-6">
              <div className="mb-4 p-3.5 bg-amber-400/20 text-amber-300 rounded-full ring-2 ring-amber-400/40 shadow-inner mx-auto w-fit">
                <Gift className="h-10 w-10 text-amber-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-amber-300 mb-2">
                Discount Unlocked! 🎉
              </h2>
              <p className="text-emerald-100/90 text-sm max-w-xs leading-relaxed">
                Check your WhatsApp! We've sent your 10% OFF code & Vedic Millet Recipe Guide.
              </p>
            </div>
          ) : (
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-2.5">
                <span>🌾 Shree Anna Special Gift</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">10% OFF</span> + Recipe Book
              </h2>
              <p className="text-emerald-100/80 mb-6 text-xs sm:text-sm max-w-[310px] leading-relaxed">
                Join our healthy eating family. Get your 10% coupon & 25+ satvik millet recipes sent directly to your WhatsApp!
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-3">
                <div className="space-y-2.5">
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-emerald-400/20 focus:border-amber-400 focus:bg-white/15 focus:ring-2 focus:ring-amber-400/30 transition-all outline-none text-sm text-white placeholder:text-emerald-200/50"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-emerald-200 text-sm font-semibold border-r border-emerald-500/30 pr-2 mr-2 pointer-events-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="WhatsApp Number"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-16 pr-4 py-3 rounded-xl bg-white/10 border border-emerald-400/20 focus:border-amber-400 focus:bg-white/15 focus:ring-2 focus:ring-amber-400/30 transition-all outline-none text-sm text-white placeholder:text-emerald-200/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl py-6 text-sm sm:text-base font-bold shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 mt-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-emerald-950 hover:brightness-105 hover:scale-[1.01]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-950" />
                      Sending Coupon...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4 text-emerald-950" />
                      Claim 10% OFF on WhatsApp 🌿
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-emerald-200/60 mt-2">
                  🔒 No spam, ever. Only pure Shree Anna offers & nutrition tips.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPopup;
