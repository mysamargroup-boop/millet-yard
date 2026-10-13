
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Privacy Policy</h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Your privacy and data security are our top priorities.</p>
      </header>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-foreground/90">
        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">We collect information that you provide directly to us when you place an order, contact us, or subscribe to our newsletter. This information may include your name, email address, phone number, and shipping address.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">We use the information we collect to process your orders, communicate with you, and improve our services. We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">3. Data Security</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">We implement a variety of industry-standard security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">4. AI Chatbot Privacy</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Our AI Chatbot (&quot;Millet Yard AI&quot;) is powered by secure processors. Chat interactions are processed to answer your product queries and order lookups. Session history is ephemeral. We do not sell or use your personal order data for model training.</p>
        </section>

        <section className="bg-card p-5 rounded-2xl border">
          <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">5. Your Consent</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">By using our site, you consent to our website privacy policy.</p>
        </section>
      </div>
    </div>
  );
}
