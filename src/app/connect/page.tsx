'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, ShieldCheck, Truck, Sprout, Sparkles, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSiteSettings } from '@/lib/data-async';
import { SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const CONTACT_FAQS = [
  {
    q: "How long does shipping take across India?",
    a: "Orders are dispatched within 24 to 48 hours via premium express couriers (Delhivery, Bluedart, Xpressbees). Delivery typically takes 2–4 business days for metro cities and 4–6 days for regional destinations."
  },
  {
    q: "Are all Millet Yard grains 100% unpolished?",
    a: "Yes, absolutely! Unlike commercial polished grains that strip away the nutrient-rich bran, our millets are 100% unpolished, stone-ground, and retain their full natural dietary fibre, lignans, and minerals."
  },
  {
    q: "Why is soaking millets for 6–8 hours recommended?",
    a: "Unpolished millets contain natural insoluble fibre and phytic acid. Soaking softens the grain, breaks down phytates for maximum mineral absorption (calcium, iron, magnesium), and ensures soft, easily digestible meals."
  },
  {
    q: "Do you supply in bulk for bulk cooking or institutions?",
    a: "Yes! We cater to organic cafes, schools, ayurvedic wellness centers, and corporate gifting. Please select 'Bulk / Wholesale Inquiry' in the message form or contact us directly on WhatsApp."
  }
];

export default function ConnectPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const fetchedSettings = await getSiteSettings();
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to fetch site settings", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const contactPhone = settings.contact_phone || '+91 9691045405';
  const cleanPhone = contactPhone.replace(/[^\d+]/g, '');
  const contactEmail = settings.contact_email || 'support@milletyard.com';
  const contactAddress = settings.contact_address || 'Millet Yard Pvt Ltd, Jabalpur, Madhya Pradesh, India';

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();

    const text = `Namaste Millet Yard Team! 🙏\n\n*Name:* ${name}\n*Email:* ${email}\n*Phone:* ${phone || 'Not provided'}\n*Topic:* ${subject}\n\n*Message:*\n${message}`.trim();
    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/919691045405?text=${encoded}`;
    window.open(waUrl, '_blank');
    setIsSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header */}
      <header className="text-center mb-10 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
          We&apos;re Here to Help You Eat Pure
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Have a question about our unpolished Shree Anna millets, live order tracking, or authentic cooking methods? Reach out to our dedicated support team.
        </p>
      </header>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {/* Phone / Call */}
        <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center mb-3">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Phone & WhatsApp</h3>
            <p className="text-xs text-muted-foreground mt-1">Direct customer assistance & phone support</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
            <a
              href={`tel:${cleanPhone}`}
              className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline block"
            >
              {contactPhone}
            </a>
            <a
              href="https://wa.me/919691045405?text=Hello%20Millet%20Yard%20Team,%20I%20have%20an%20inquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp &rarr;
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Email Support</h3>
            <p className="text-xs text-muted-foreground mt-1">Official inquiries, orders & B2B bulk orders</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40">
            <a
              href={`mailto:${contactEmail}`}
              className="text-sm font-semibold text-foreground hover:text-primary hover:underline block"
            >
              {contactEmail}
            </a>
            <span className="text-xs text-muted-foreground mt-1 block">Response within 24 hours</span>
          </div>
        </div>

        {/* Physical Office & Farm Hub */}
        <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center mb-3">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Sourcing & Packaging Hub</h3>
            <p className="text-xs text-muted-foreground mt-1">Stone-milling & vacuum-sealing facility</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-xs font-medium text-foreground leading-relaxed">
              {contactAddress}
            </p>
            <span className="text-[11px] text-muted-foreground mt-1 block">Mon–Sat: 9:00 AM – 6:00 PM IST</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Side Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Message Form */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold">Send Us a Direct Message</CardTitle>
              <CardDescription className="text-xs">
                Fill in the details below. We connect directly on WhatsApp or Email for zero delays.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">Message Dispatched!</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Thank you, {name || 'Friend'}! Your query has been routed to our WhatsApp desk. Our team will assist you shortly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      setIsSubmitted(false);
                      setMessage('');
                    }}
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleWhatsAppSend} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold">Your Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Ramesh Patel"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="text-xs h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g. ramesh@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="text-xs h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">Phone / WhatsApp Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="text-xs h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-xs font-semibold">Topic of Inquiry</Label>
                      <select
                        id="subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="Order Tracking & Delivery">📦 Order Tracking & Delivery</option>
                        <option value="Product Nutrition & Soaking Advice">🌾 Nutrition & Soaking Advice</option>
                        <option value="Bulk & Wholesale Orders">💼 Bulk & Wholesale Orders</option>
                        <option value="Farmer Partnership / Sourcing">🌱 Farmer Partnership / Sourcing</option>
                        <option value="General Inquiry">💬 General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-semibold">Your Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Please share your questions, specific requirements, or order ID..."
                      rows={4}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      required
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs h-10 gap-2"
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send Message via WhatsApp
                    </Button>
                    <a
                      href={`mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nPhone: ${phone}\n\nMessage:\n${message}`)}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                    >
                      Send via Email Instead
                    </a>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Trust Badges & Track Link */}
        <div className="lg:col-span-5 space-y-4">
          {/* Order Tracking Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Live Order Tracking
              </span>
              <h3 className="font-bold text-base leading-snug">Already placed an order?</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Check instant dispatch progress, courier partner, and live Shiprocket location in real time.
              </p>
              <div className="pt-2">
                <Link
                  href="/track-order"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-950 font-semibold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
                >
                  Track Your Order Now &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Core Guarantees Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border/80 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">The Millet Yard Promise</h4>
            <div className="space-y-2.5 text-xs text-foreground">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>100% Unpolished:</strong> Natural bran intact, zero chemical bleaching.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Sprout className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Direct Farm Sourcing:</strong> Supporting sustainable rural Indian cultivators.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Stone-Ground Cold Milling:</strong> Zero heat degradation of vitamins & fibres.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <section className="mt-12 pt-8 border-t border-border/60">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-headline mt-1">Quick Self-Service Answers</h2>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {CONTACT_FAQS.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border rounded-xl px-4 py-1 bg-card">
                <AccordionTrigger className="text-xs sm:text-sm font-semibold hover:no-underline text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
