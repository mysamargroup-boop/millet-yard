
import { BadgeInfo } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Pricing & Payment</h1>
      </header>

      <div className="space-y-8 prose dark:prose-invert max-w-none">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Pricing Philosophy</h2>
          <p>At Millet Yard, we believe in transparent and fair pricing. As a direct-from-farm and bulk supplier, our pricing is structured to provide supreme value. All prices listed on this site are inclusive of all applicable taxes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Bulk Discounts</h2>
          <p>The prices you see reflect our wholesale rates. For very large orders or custom requirements, please contact us directly for a personalized quote. We are happy to work with you to meet your specific needs.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Payment Terms</h2>
          <p>To confirm a bulk order, we require a **5% advance payment**. The remaining balance is due before dispatch. This policy helps us streamline production and ensure your order is processed efficiently.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">For Retail Purchases</h2>
          <p>For retail and family packs, you can order directly through our store or reach out to our farm support team on WhatsApp at <a href="https://milletyard.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">milletyard.com</a>.</p>
        </section>

      </div>
    </div>
  );
}
