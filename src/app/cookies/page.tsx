import { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, Settings, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | Millet Yard",
  description: "Learn how Millet Yard uses cookies to deliver a safe, personalized shopping experience while respecting your privacy under Indian DPDP Act 2023.",
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl font-body">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 mb-4 border border-emerald-200 dark:border-emerald-800">
          <Cookie className="h-7 w-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-slate-900 dark:text-slate-100">
          Cookie Policy & Settings
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          We believe in transparent, honest privacy. This policy explains what cookies are, how we use them to keep your shopping cart intact, and how you stay in complete control.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Last Updated: October 2026 • Compliant with DPDP Act 2023</p>
      </header>

      {/* Content Sections */}
      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-foreground/90">
        
        {/* Section 1: What are cookies */}
        <section className="bg-card p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">1</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">What Are Cookies?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small, secure text files that websites store on your computer, mobile phone, or tablet when you visit them. They act like a memory bank for the website, allowing it to remember your actions, preferences (such as language, theme, and items placed in your shopping bag), and login status so you don&apos;t have to re-enter them every time you navigate from page to page.
          </p>
        </section>

        {/* Section 2: Types of Cookies */}
        <section className="bg-card p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">2</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Cookies We Use on Millet Yard</h2>
          </div>
          <p className="text-muted-foreground mb-5">
            We only use cookies that serve genuine, beneficial purposes for your shopping journey:
          </p>

          <div className="space-y-4">
            {/* Category A */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  A. Strictly Essential Cookies (Always Active)
                </h3>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Required
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                These cookies are necessary for the website to function properly. Without them, core features like keeping unpolished millets in your shopping bag, preserving coupon codes, and processing secure payments through Cashfree and UPI cannot work.
              </p>
            </div>

            {/* Category B */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  B. Performance & Analytics Cookies
                </h3>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Optional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We use privacy-friendly analytics (such as Google Analytics / Tag Manager) to understand which healthy recipes and superfood guides are most helpful to our community, identify slow-loading pages, and fix software glitches. All data is aggregated and anonymized.
              </p>
            </div>

            {/* Category C */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  C. Marketing & Experience Cookies
                </h3>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Optional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Used with trusted partners like Meta (Facebook/Instagram) to show relevant nutritional discounts and seasonal harvest offers to customers who were previously exploring our farm products. We never sell your personal data.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: How to control cookies */}
        <section className="bg-card p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">3</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">How You Can Control Cookies</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-3">
            You can manage or revoke your consent at any time:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>On Millet Yard:</strong> Use our on-screen Cookie Consent Banner to choose between <em>Accept All</em> or <em>Essential Only</em>.
            </li>
            <li>
              <strong>In Your Browser:</strong> You can block or delete cookies in your browser settings (Chrome: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Settings &gt; Privacy &amp; Security &gt; Third-party cookies</code>; Safari: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Preferences &gt; Privacy</code>). Note that disabling essential cookies may prevent you from completing a purchase.
            </li>
          </ul>
        </section>

        {/* Section 4: Questions */}
        <section className="bg-card p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">4</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Questions or Concerns?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions regarding your data privacy or cookie preferences, feel free to reach out to us at{" "}
            <a href="mailto:support@milletyard.com" className="text-emerald-700 dark:text-emerald-400 font-medium underline">
              support@milletyard.com
            </a>{" "}
            or visit our{" "}
            <Link href="/privacy" className="text-emerald-700 dark:text-emerald-400 font-medium underline">
              Privacy Policy
            </Link>.
          </p>
        </section>

      </div>
    </div>
  );
}
