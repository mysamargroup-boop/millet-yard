
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Terms & Conditions</h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Please read these terms carefully before placing your order.</p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-foreground/90">
        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Welcome to Millet Yard. By accessing our website and placing orders, you agree to comply with and be bound by the following terms and conditions of use, which govern Millet Yard's relationship with you.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">2. Intellectual Property</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">The content, branding, photos, recipes, and text on this website are the property of Millet Yard. Reproduction or unauthorized use without written permission is strictly prohibited.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">3. Product Purity & Natural Variations</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Our Shree Anna millets, flours, and pickles are 100% natural, unpolished, and chemical-free. Minor natural variations in grain color, texture, and harvest aroma may occur across crop seasons, reflecting genuine pesticide-free farming.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">4. Limitation of Liability</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Millet Yard strives to ensure accurate product listings and reliable doorstep delivery across India. In no event will we be liable for indirect or consequential damages beyond the value of the purchased goods.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">5. AI Assistant Usage</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">The &quot;Millet Yard AI&quot; assistant is provided for nutritional information, millet recipes, and order lookup assistance. For urgent payment or address changes, please connect with our support team on WhatsApp.</p>
        </section>
      </div>
    </div>
  );
}
