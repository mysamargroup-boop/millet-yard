
import { Shield, Truck, FileText, BadgeInfo } from "lucide-react";
import { getSiteSettings } from "@/lib/actions";

export default async function ShippingPage() {
  const settings = await getSiteSettings();
  const freeShippingThreshold = settings.free_shipping_threshold ?? 2999;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Shipping & Order Policies</h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Everything you need to know about doorstep shipping & delivery across India.</p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-foreground/90">
        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2.5 text-foreground">
            <Truck className="h-5 w-5 text-primary" />
            1. Shipping & Dispatch
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We are committed to delivering farm-fresh, unpolished millets in tamper-proof, food-grade packaging. All orders are packed and dispatched within 24 to 48 hours. Standard courier delivery takes between {settings.expected_delivery_min_days || 3} and {settings.expected_delivery_max_days || 7} business days depending on your pin code.
          </p>
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-200">
            🌾 <strong>Free Doorstep Shipping:</strong> Available on all orders above ₹{freeShippingThreshold || 499} across India.
          </div>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2.5 text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            2. Packaging & Freshness Assurance
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our stone-ground flours and unpolished grains are ground in small weekly batches. We use food-safe, multi-layered moisture-barrier pouches to preserve freshness, natural oils, and germ vitality without any chemical fumigation or chemical anti-caking agents.
          </p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2.5 text-foreground">
            <BadgeInfo className="h-5 w-5 text-primary" />
            3. Order Tracking & WhatsApp Alerts
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Once dispatched, a live tracking link is instantly sent to your registered WhatsApp number and email. You can also track your parcel at any time using our <a href="/track-order" className="text-primary hover:underline font-semibold">Track Order page</a>.
          </p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2.5 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            4. Transparent Pricing & GST
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All prices listed on Millet Yard are in Indian Rupees (INR) and inclusive of all applicable GST taxes. We offer secure online payment via UPI, Credit/Debit cards, and Net Banking.
          </p>
        </section>
      </div>
    </div>
  );
}
