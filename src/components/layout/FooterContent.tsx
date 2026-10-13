
"use client";

import Link from 'next/link';
import { Facebook, Instagram, Youtube, Linkedin, ArrowRight, Twitter } from 'lucide-react';
import Logo from '../icons/Logo';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export const FooterContent = ({ settings, allCategories }: { settings: any, allCategories: any[] }) => {
  const shopLinks = allCategories.slice(0, 4).map(c => ({ href: `/collections/${c.id}`, label: c.name }));
  shopLinks.push({ href: '/offers', label: 'Special Offers' });

  const linkSections = [
    {
      title: 'Shop',
      links: shopLinks,
    },
    {
      title: 'About',
      links: [
        { href: '/our-story', label: 'Our Story' },
        { href: '/blog', label: 'Blog' },
        { href: '/connect', label: 'Contact Us' },
      ],
    },
    {
      title: 'Legacy',
      links: [
        { href: '/career', label: 'Careers' },
        { href: '/terms', label: 'Terms & Conditions' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/cookies', label: 'Cookie Policy' },
        { href: '/shipping', label: 'Shipping Policy' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/returns-and-refunds', label: 'Returns & Refunds' },
      ],
    },
  ];

  return (
    <footer className="bg-primary/5 border-t mt-auto pb-20 md:pb-0">
      <div className="container mx-auto px-4 pt-4 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 border-b pb-8">
          <div className="lg:col-span-2 flex flex-col items-center text-center md:items-start md:text-left">
            <Logo />
            <p className="text-sm text-muted-foreground mt-4 max-w-md">100% Unpolished Traditional Heritage Millets & Stone-Ground Flours. Sourced directly from native farmers, promoting holistic wellness, low GI nutrition & gut health.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="hidden md:grid md:grid-cols-3 col-span-3 gap-8">
            {linkSections.map((section: any) => (
              <div key={section.title}>
                <h3 className="font-bold text-lg text-foreground mb-4">{section.title}</h3>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link: any) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary font-semibold">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="md:hidden col-span-1">
            <Accordion type="single" collapsible className="w-full">
              {linkSections.map((section: any) => (
                <AccordionItem value={section.title} key={section.title}>
                  <AccordionTrigger className="font-bold text-lg text-foreground">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pt-2">
                      {section.links.map((link: any) => (
                        <li key={link.href}>
                          <Link href={link.href} className="text-muted-foreground hover:text-primary font-medium">{link.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-bold text-lg text-foreground mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">Subscribe for special offers, and new product announcements.</p>
            <form className="flex">
              <Input type="email" placeholder="Your e-mail" className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0" />
              <Button type="submit" className="rounded-l-none">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
            {/* Contact Info */}
            <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Email:</span>
                <a
                  href={`mailto:${settings?.contact_email || 'support@milletyard.com'}`}
                  className="text-foreground hover:text-emerald-700 font-medium underline underline-offset-4 transition-colors"
                >
                  {settings?.contact_email || 'support@milletyard.com'}
                </a>
              </p>
              {settings?.contact_address && <p className="text-xs leading-relaxed">{settings.contact_address}</p>}
              <p className="flex items-center gap-2">
                <span className="font-semibold text-foreground">WhatsApp:</span>
                <a
                  href={`https://wa.me/${(settings?.contact_phone || '919691045405').replace(/\D/g, '').length === 10 ? `91${(settings?.contact_phone || '919691045405').replace(/\D/g, '')}` : (settings?.contact_phone || '919691045405').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-emerald-700 font-medium underline underline-offset-4 transition-colors flex items-center gap-1"
                >
                  <span>{settings?.contact_phone || '+91 96910 45405'}</span>
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-3 mt-5">
              {/* Instagram */}
              <Link 
                href={settings.social_instagram || "https://instagram.com/milletyard"} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Millet Yard Instagram"
                className="h-9 w-9 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-pink-600 hover:border-pink-300 transition-all hover:scale-110 shadow-sm"
              >
                <Instagram size={18} />
              </Link>

              {/* YouTube */}
              <Link 
                href={settings.social_youtube || "https://youtube.com/@milletyard"} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Millet Yard YouTube"
                className="h-9 w-9 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-300 transition-all hover:scale-110 shadow-sm"
              >
                <Youtube size={18} />
              </Link>

              {/* Pinterest */}
              <Link 
                href="https://pinterest.com/milletyard" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Millet Yard Pinterest"
                className="h-9 w-9 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-red-700 hover:border-red-400 transition-all hover:scale-110 shadow-sm"
              >
                <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
              </Link>

              {/* WhatsApp */}
              <Link 
                href="https://wa.me/919691045405?text=Hello%20Millet%20Yard,%20I%20have%20an%20enquiry" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Millet Yard WhatsApp"
                className="h-9 w-9 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:border-emerald-300 transition-all hover:scale-110 shadow-sm"
              >
                <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </Link>

              {/* Facebook */}
              <Link 
                href={settings.social_facebook || "https://facebook.com/milletyard"} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Millet Yard Facebook"
                className="h-9 w-9 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-300 transition-all hover:scale-110 shadow-sm"
              >
                <Facebook size={18} />
              </Link>

              {/* Twitter / X */}
              <Link 
                href={settings.social_twitter || "https://x.com/milletyard"} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Millet Yard Twitter / X"
                className="h-9 w-9 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-sky-500 hover:border-sky-300 transition-all hover:scale-110 shadow-sm"
              >
                <Twitter size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {settings.invoice_business_name || 'Millet Yard'}. All rights reserved.
          </p>
          <p className="text-xs mt-2 text-muted-foreground/80">
            Designed by{' '}
            <a
              href="https://instagram.com/shubham__nema"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Samar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
