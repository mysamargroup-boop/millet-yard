"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "milletyard_cookie_consent_v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user already consented
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Show banner with a gentle delay so page loads cleanly first
        const timer = setTimeout(() => {
          setVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage disabled / private browsing fallback
    }
  }, []);

  const handleConsent = (level: "all" | "essential") => {
    setIsClosing(true);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level,
          timestamp: new Date().toISOString(),
          version: 1,
        })
      );
      // Dispatch custom event if other modules listen
      window.dispatchEvent(
        new CustomEvent("cookie-consent-updated", { detail: { level } })
      );
    } catch {
      // ignore
    }
    setTimeout(() => {
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        // Position: Bottom left on desktop (leaving bottom right for Chatbot), bottom pinned on mobile above nav
        "bottom-20 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md",
        isClosing
          ? "opacity-0 translate-y-4 scale-95"
          : "opacity-100 translate-y-0 scale-100"
      )}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-stone-200/90 dark:border-stone-800 font-body text-foreground">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
            <Cookie className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-bold text-xs sm:text-sm text-foreground">
                We Value Your Privacy
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-medium">
                <ShieldCheck className="h-3 w-3" /> DPDP
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              We use cookies to keep your millet cart intact, secure checkout, and improve your shopping experience. You can choose to accept all or only essential cookies.
            </p>
          </div>

          <button
            onClick={() => handleConsent("essential")}
            aria-label="Close cookie banner with essential only"
            className="absolute top-3 right-3 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/cookies"
            className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
          >
            Cookie Policy
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleConsent("essential")}
              className="h-8 px-3 text-[11px] rounded-lg border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 font-medium"
            >
              Essential Only
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleConsent("all")}
              className="h-8 px-3.5 text-[11px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-xs"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
