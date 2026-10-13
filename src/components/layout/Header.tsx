"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, Search, Gift, Box, Brush, Info, ShoppingBag, LayoutGrid, Heart, Mail, Phone, KeyRound, Smartphone, ImageIcon, Moon, Sun, Sparkles, User, LogOut, Facebook, Instagram, Youtube, Linkedin, Twitter, Mic, Package } from 'lucide-react';
import Logo from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '../ui/input';
import { usePathname, useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';
import { cn, slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Product, Category, SiteSettings } from '@/lib/types';
import Image from 'next/image';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { BLUR_DATA_URL } from '@/lib/constants';
import { useTheme } from 'next-themes';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useAuth } from '@/lib/auth';
import { useCustomerAuth } from '@/lib/customer-auth';
import CustomerAuthModal from '@/components/auth/CustomerAuthModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { trackSearch } from '@/lib/analytics';
import { useSettings } from '@/lib/settings-context';

const Marquee = () => {
  const messages = ["🌾 100% Pure & Unpolished Shree Anna Millets", "🚚 Free Shipping on Orders Above ₹499", "🌱 Freshly Stone-Ground Flours & Cold Milled Grains"];
  const marqueeContent = messages.join(" • ");
  return (
    <div className="bg-yellow-400 text-black py-1 text-center text-sm overflow-hidden">
      <div className="marquee">
        <span className="mx-4">{marqueeContent}</span>
        <span className="mx-4">{marqueeContent}</span>
      </div>
    </div>
  )
}

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 mb-6">
      <div className="flex items-center space-x-2">
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        <Label htmlFor="dark-mode-toggle" className="font-semibold text-foreground">
          Dark Mode
        </Label>
      </div>
      <Switch
        id="dark-mode-toggle"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </div>
  );
};

// Extracted MobileNavContent to prevent focus loss
interface MobileNavContentProps {
  setIsSheetOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void; // Using this to trigger handleSearch in parent
  handleSearch: (query: string) => void;
  isListening: boolean;
  handleVoiceSearch: () => void;
  searchResults: Product[];
  isSearchOpen: boolean;
  router: any;
  allCategories: Category[];
  headerLinks: { href: string; label: string; isMegaMenu: boolean; special: boolean }[];
  pathname: string;
  siteSettings: SiteSettings;
  user: any;
  customer: any;
  customerLogout: () => void;
  wishlistCount: number;
  cartCount: number;
  isCountsLoaded: boolean;
}

const MobileNavContent = ({
  setIsSheetOpen,
  searchQuery,
  handleSearch,
  isListening,
  handleVoiceSearch,
  searchResults,
  isSearchOpen,
  router,
  allCategories,
  headerLinks,
  pathname,
  siteSettings,
  user,
  customer,
  customerLogout,
  wishlistCount,
  cartCount,
  isCountsLoaded
}: MobileNavContentProps) => {

  const handleMobileSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query && query.trim().length > 0) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      setIsSheetOpen(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* User Account Section */}
      {customer ? (
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-xl p-3 mb-3 border border-primary/15">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {customer.name || customer.phone || 'Welcome!'}
              </p>
              <p className="text-[10px] text-muted-foreground">Logged in</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={() => { customerLogout(); setIsSheetOpen(false); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          {/* Quick account actions */}
          <div className="flex gap-2 mt-3">
            <Link
              href="/account"
              onClick={() => setIsSheetOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-background/80 hover:bg-background border border-border/50 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold">My Account</span>
            </Link>
            <Link
              href="/account?tab=orders"
              onClick={() => setIsSheetOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-background/80 hover:bg-background border border-border/50 transition-colors"
            >
              <Box className="h-3.5 w-3.5 text-accent" />
              <span className="text-[11px] font-semibold">My Orders</span>
            </Link>
          </div>
        </div>
      ) : siteSettings.customer_login_enabled ? (
        <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-3 mb-3 border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Welcome, Guest</p>
              <p className="text-[10px] text-muted-foreground">Login for a better experience</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Action Row: Track Order & Special Offers */}
      <div className="flex gap-2 mb-3">
        <Link
          href="/track-order"
          onClick={() => setIsSheetOpen(false)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition-colors group"
        >
          <Package className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="text-xs font-semibold whitespace-nowrap">Track Order</span>
        </Link>
        <Link
          href="/offers"
          onClick={() => setIsSheetOpen(false)}
          className="flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors group"
        >
          <span className="text-xs font-semibold whitespace-nowrap">Special Offers</span>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleMobileSearchSubmit} className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          placeholder="Search millets, grains, flours, combos..."
          className="pl-10 pr-10 bg-muted/50 rounded-xl"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleVoiceSearch();
          }}
        >
          <Mic className={cn("h-4 w-4 text-muted-foreground transition-colors", isListening && "text-red-500 animate-pulse")} />
        </Button>
        {/* Mobile Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg">
            <div className="p-2 space-y-1">
              {searchResults.slice(0, 5).map(product => {
                const categorySlug = slugify(product.category.split(',')[0]);
                const productSlug = slugify(product.name);
                return (
                  <Link
                    key={product.id}
                    href={`/collections/${categorySlug}/${productSlug}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/10"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                    </div>
                  </Link>
                );
              })}
              {searchResults.length > 5 && (
                <div className="p-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
                      setIsSheetOpen(false);
                    }}
                  >
                    View All Results
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-2.5">
          {/* Categories Section */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-3 border border-primary/10">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Browse Categories</p>
                      <p className="text-[10px] text-muted-foreground">{allCategories.length} collections</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {allCategories.map(category => (
                      <Link
                        key={category.id}
                        href={category.linkUrl || `/collections/${category.id}`}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background hover:bg-accent/10 border border-transparent hover:border-primary/20 transition-all group"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="font-medium text-[10px] text-center text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{category.name}</p>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Quick Links Section */}
          <div className="bg-muted/30 rounded-xl p-2 border flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Quick Links</p>
            {
              headerLinks.filter(l => !l.isMegaMenu).map((link) => {
                const isActive = pathname.startsWith(link.href);
                const specialClassName = link.label === 'Our Story'
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent";

                const Icon = link.label === 'Shop' ? ShoppingBag :
                  link.href.includes('our-story') ? Info :
                    link.href.includes('connect') ? Mail : ShoppingBag;

                return (
                  <Button key={link.label} variant="ghost" asChild className="w-full h-auto py-1.5 px-2 hover:bg-accent/10 group justify-start rounded-lg" data-active={isActive}>
                    <Link href={link.href} onClick={() => setIsSheetOpen(false)} className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-foreground group-hover:text-accent transition-colors",
                        link.special ? specialClassName :
                          (isActive) && "bg-gradient-to-r from-destructive to-accent bg-clip-text text-transparent"
                      )}>
                        {link.label}
                      </span>
                    </Link>
                  </Button>
                )
              })
            }
          </div>

          {/* Dark Mode Toggle Removed */}
        </nav>
      </ScrollArea>

      {/* Footer Section: Complete Social Suite matching footer */}
      <div className="mt-auto space-y-3 pt-3 border-t">
        <div className="flex items-center justify-center gap-2.5">
          {/* Instagram */}
          <Link
            href={siteSettings.social_instagram || "https://instagram.com/milletyard"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-pink-600 hover:border-pink-300 transition-all hover:scale-110 shadow-sm"
          >
            <Instagram size={15} />
          </Link>

          {/* YouTube */}
          <Link
            href={siteSettings.social_youtube || "https://youtube.com/@milletyard"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-300 transition-all hover:scale-110 shadow-sm"
          >
            <Youtube size={15} />
          </Link>

          {/* Pinterest */}
          <Link
            href="https://pinterest.com/milletyard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pinterest"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-red-700 hover:border-red-400 transition-all hover:scale-110 shadow-sm"
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
            </svg>
          </Link>

          {/* WhatsApp */}
          <Link
            href="https://wa.me/919691045405?text=Hello%20Millet%20Yard,%20I%20have%20an%20enquiry"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:border-emerald-300 transition-all hover:scale-110 shadow-sm"
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </Link>

          {/* Facebook */}
          <Link
            href={siteSettings.social_facebook || "https://facebook.com/milletyard"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-300 transition-all hover:scale-110 shadow-sm"
          >
            <Facebook size={15} />
          </Link>

          {/* Twitter / X */}
          <Link
            href={siteSettings.social_twitter || "https://x.com/milletyard"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter / X"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-sky-500 hover:border-sky-300 transition-all hover:scale-110 shadow-sm"
          >
            <Twitter size={15} />
          </Link>
        </div>

        {/* Contact info: Email & WhatsApp */}
        <div className="pt-2 text-center space-y-1 text-xs text-muted-foreground border-t border-border/40">
          <div className="flex items-center justify-center gap-1.5 font-medium">
            <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <a href={`mailto:${siteSettings.contact_email || 'support@milletyard.com'}`} className="hover:text-primary transition-colors text-[11px] sm:text-xs">
              {siteSettings.contact_email || 'support@milletyard.com'}
            </a>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-medium">
            <Phone className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <a href="https://wa.me/919691045405?text=Hello%20Millet%20Yard" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors text-[11px] sm:text-xs">
              WhatsApp: +91 9691045405
            </a>
          </div>
        </div>

        {user && (
          <Button variant="outline" asChild className="w-full justify-start rounded-xl text-xs">
            <Link href="/sr-admin" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Admin Panel
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

const Header = () => {
  const { cartCount, isLoaded: cartLoaded } = useCart();
  const { wishlistCount, isLoaded: wishlistLoaded } = useWishlist();

  const { user } = useAuth();
  const { customer, logout: customerLogout } = useCustomerAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const { settings: siteSettings } = useSettings();

  const pathname = usePathname() || '';
  const router = useRouter();

  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);

  // ... (keeping existing useEffects and handlers)

  const handleVoiceSearch = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Optimized for Indian English accents and millet terminology
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Listening... 🎙️",
          description: "Say a millet name (e.g. 'Foxtail Millet', 'Ragi Atta', 'Sattu')...",
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        handleSearch(transcript);
        setIsListening(false);
        toast({
          title: "Voice query received!",
          description: `Searching for: "${transcript}"`,
        });
        if (transcript.trim()) {
          router.push(`/shop?search=${encodeURIComponent(transcript.trim())}`);
          setIsSheetOpen(false);
          setIsSearchOpen(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            variant: "destructive",
            title: "Microphone Access Denied",
            description: "Please allow microphone access in your browser bar to use voice search.",
          });
        } else if (event.error === 'no-speech') {
          toast({
            title: "No speech heard",
            description: "Please try again and speak clearly into your mic.",
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start error:', err);
        setIsListening(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Voice Search Not Supported",
        description: "Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.",
      });
    }
  };

  const headerLinks = [
    { href: '/collections', label: 'Categories', isMegaMenu: true, special: false },
    { href: '/shop', label: 'Shop', isMegaMenu: false, special: true },
    { href: '/our-story', label: 'Our Story', isMegaMenu: false, special: true },
    { href: '/connect', label: 'Contact Us', isMegaMenu: false, special: false },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const { getProductsDirect, getCategoriesDirect } = await import('@/lib/supabase');
        const { DUMMY_PRODUCTS, DUMMY_CATEGORIES } = await import('@/lib/dummy-data');

        const [products, categories] = await Promise.all([
          getProductsDirect(),
          getCategoriesDirect()
        ]);

        // Fallback to dummy data when DB is empty
        setAllProducts(products.length > 0 ? products : DUMMY_PRODUCTS);
        setAllCategories(categories.length > 0 ? categories : DUMMY_CATEGORIES);
      } catch (error) {
        console.error('Error fetching header data:', error);
        // Even on error, show dummy categories so the header isn't empty
        try {
          const { DUMMY_PRODUCTS, DUMMY_CATEGORIES } = await import('@/lib/dummy-data');
          setAllProducts(DUMMY_PRODUCTS);
          setAllCategories(DUMMY_CATEGORIES);
        } catch { }
      }
    }
    fetchData();
  }, [])

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length > 1) {
      const lowerCaseQuery = query.toLowerCase();
      const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerCaseQuery)) ||
        p.category.toLowerCase().includes(lowerCaseQuery) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [allProducts]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      trackSearch(searchQuery);
      setIsSearchOpen(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    setIsSheetOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsListening(false);
  }, [pathname]);

  const isCountsLoaded = cartLoaded && wishlistLoaded;

  const DesktopNavContent = () => {
    const isCollectionsActive = pathname === '/collections';
    return (
      <NavigationMenu>
        <NavigationMenuList>
          {headerLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/collections' && pathname.startsWith(link.href) && !link.isMegaMenu);
            const specialClassName = link.label === 'Our Story'
              ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent";

            if (link.isMegaMenu) {
              return (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuTrigger className={cn(
                    navigationMenuTriggerStyle(),
                    "h-auto p-2 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent text-sm font-semibold text-foreground hover:text-accent transition-colors uppercase"
                  )}>
                    <span className={cn(isCollectionsActive && "stylish-underline")}>{link.label}</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[92vw] sm:w-[700px] md:w-[780px] lg:w-[840px] max-h-[calc(85vh-70px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl relative shadow-2xl border border-emerald-200/80 bg-gradient-to-b from-white via-emerald-50/20 to-white dark:from-slate-900 dark:to-slate-950">
                      {/* Decorative Background Elements for Mega Menu */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        <div className="absolute -top-12 -right-8 w-[200px] h-[200px] rounded-full opacity-[0.10] bg-emerald-400 blur-2xl" />
                        <div className="absolute -bottom-16 -left-8 w-[180px] h-[180px] rounded-full opacity-[0.08] bg-amber-400 blur-2xl" />
                      </div>

                      {/* Dropdown header band */}
                      <div className="px-5 py-2.5 border-b sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 flex items-center justify-between border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold tracking-wide text-emerald-950 dark:text-emerald-100">Shree Anna Millets & Superfoods</span>
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200">{allCategories.length} Categories</span>
                          </div>
                        </div>
                        <Link href="/collections" className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-colors">
                          All Collections →
                        </Link>
                      </div>

                      {allCategories.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 md:p-4">
                          {allCategories.map(category => (
                            <Link
                              key={category.id}
                              href={category.linkUrl || `/collections/${category.id}`}
                              className="group flex flex-col items-center rounded-xl p-2 transition-all bg-white/80 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm hover:shadow-md"
                            >
                              <div className="aspect-[4/3] relative w-full mb-1.5 overflow-hidden rounded-lg bg-emerald-50/40 dark:bg-slate-700 ring-1 ring-black/5">
                                <Image
                                  src={category.imageUrl}
                                  alt={category.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  data-ai-hint={category.imageHint}
                                  sizes="(max-width: 768px) 50vw, 25vw"
                                  placeholder="blur"
                                  blurDataURL={BLUR_DATA_URL}
                                />
                              </div>
                              <p className="font-semibold text-xs md:text-sm text-center text-foreground group-hover:text-emerald-800 dark:group-hover:text-emerald-300 line-clamp-1 transition-colors">
                                {category.name}
                              </p>
                              {category.description && (
                                <p className="text-[10px] text-muted-foreground group-hover:text-emerald-700/80 text-center line-clamp-1 mt-0.5">
                                  {category.description}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-muted-foreground w-full flex flex-col items-center justify-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <p>Loading categories...</p>
                        </div>
                      )}

                      {/* Dropdown bottom footer bar */}
                      <div className="px-5 py-2.5 bg-emerald-50/90 dark:bg-slate-900/90 border-t border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-[11px] text-emerald-900 dark:text-emerald-200">
                        <span className="flex items-center gap-1 font-medium">
                          🌾 100% Unpolished Shree Anna • Cold Stone-Ground • Zero Preservatives
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 hidden sm:inline">
                          🚚 Free Shipping Above ₹499
                        </span>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            }
            return (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink asChild>
                  <Link href={link.href} className={cn(
                    navigationMenuTriggerStyle(),
                    "h-auto p-2 bg-transparent hover:bg-transparent focus:bg-transparent text-sm font-semibold text-foreground hover:text-accent transition-colors uppercase"
                  )}>
                    <span className={cn(
                      link.special ? specialClassName : (isActive && "bg-gradient-to-r from-destructive to-accent bg-clip-text text-transparent"),
                      isActive && !link.special && "stylish-underline"
                    )}>
                      {link.label}
                    </span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Marquee />
      {/* Gradient accent line - theme aware */}
      <div className="h-[1.5px] w-full" style={{ background: `linear-gradient(to right, transparent 5%, var(--theme-accent-secondary, #34d399) 30%, var(--theme-accent, #10b981) 50%, var(--theme-accent-secondary, #34d399) 70%, transparent 95%)`, opacity: 0.6 }} />
      {/* Clean Header Background - no distracting rings or circles */}
      <div className="container mx-auto px-4 relative">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center w-1/3">
            <div className="md:hidden mr-2">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-auto w-auto p-1 group hover:bg-transparent hover:text-accent [&_svg]:!size-6">
                    <Menu size={22} />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col h-full bg-background/95 backdrop-blur-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <SheetHeader className="border-b pb-4 mb-2 text-left">
                    <SheetTitle className="flex items-center justify-start pl-1">
                      <Logo className="h-8 w-auto" />
                    </SheetTitle>
                  </SheetHeader>
                  <MobileNavContent
                    setIsSheetOpen={setIsSheetOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                    isListening={isListening}
                    handleVoiceSearch={handleVoiceSearch}
                    searchResults={searchResults}
                    isSearchOpen={isSearchOpen}
                    router={router}
                    allCategories={allCategories}
                    headerLinks={headerLinks}
                    pathname={pathname}
                    siteSettings={siteSettings}
                    user={user}
                    customer={customer}
                    customerLogout={customerLogout}
                    wishlistCount={wishlistCount}
                    cartCount={cartCount}
                    isCountsLoaded={isCountsLoaded}
                  />
                </SheetContent>
              </Sheet>
            </div>
            {/* Desktop Search */}
            <div className="hidden md:flex relative">
              <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { setIsSearchOpen(false); router.push(`/shop?search=${encodeURIComponent(searchQuery)}`); } }} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search millets, flours, combos..."
                  className="pl-10 pr-10 w-64 bg-background"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  onClick={handleVoiceSearch}
                >
                  <Mic className={cn("h-4 w-4 text-muted-foreground transition-colors", isListening && "text-red-500 animate-pulse")} />
                </Button>
              </form>
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-80 p-2 bg-popover border rounded-md shadow-lg z-20">
                  <ScrollArea className="max-h-80">
                    <div className="space-y-1">
                      {searchResults.slice(0, 5).map(product => {
                        const categorySlug = slugify(product.category.split(',')[0]);
                        const productSlug = slugify(product.name);
                        return (
                          <Link key={product.id} href={`/collections/${categorySlug}/${productSlug}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/10">
                            <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                            <div>
                              <p className="font-semibold text-sm">{product.name}</p>
                              <p className="text-sm text-muted-foreground">₹{product.price.toFixed(2)}</p>
                            </div>
                          </Link>
                        )
                      })}
                      {searchResults.length > 5 && (
                        <Button
                          variant="ghost"
                          className="w-full text-primary"
                          onClick={() => { router.push(`/shop?search=${encodeURIComponent(searchQuery)}`); setIsSearchOpen(false); }}
                        >
                          View all {searchResults.length} results
                        </Button>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center w-auto md:w-1/3">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
          </div>

          <div className="flex items-center justify-end w-1/3">
            <div className="flex items-center gap-0 md:gap-4">
              {/* Mobile Search Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-auto w-auto p-1.5 group hover:bg-transparent [&_svg]:!size-5 mr-0.5"
                onClick={() => setIsMobileSearchOpen(prev => !prev)}
                aria-label="Toggle Mobile Search"
              >
                <Search size={21} className={cn("text-foreground group-hover:text-primary transition-colors", isMobileSearchOpen && "text-primary")} />
              </Button>

              <Button variant="ghost" size="icon" asChild className="h-auto w-auto p-1 group hover:bg-transparent [&_svg]:!size-5 md:[&_svg]:!size-6">
                <Link href="/wishlist" aria-label="Wishlist" className="relative flex items-center justify-center">
                  <Heart size={22} className="text-foreground group-hover:text-accent transition-colors" />
                  {isCountsLoaded && wishlistCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-accent bg-background text-[10px] font-bold text-accent shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="h-auto w-auto p-1 group hover:bg-transparent [&_svg]:!size-5 md:[&_svg]:!size-6">
                <Link href="/cart" aria-label="Shopping Cart" className="relative flex items-center justify-center">
                  <ShoppingCart size={22} className="text-foreground group-hover:text-primary transition-colors" />
                  {isCountsLoaded && cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary bg-background text-[10px] font-bold text-primary shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>
              {siteSettings.customer_login_enabled && (
                customer ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-auto w-auto p-1 group hover:bg-transparent [&_svg]:!size-6">
                        <div className="bg-primary/10 p-1.5 rounded-full border border-primary/20">
                          <User size={20} className="text-primary group-hover:text-primary transition-colors" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/account">My Account</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={customerLogout} className="text-red-600 focus:text-red-600">
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <CustomerAuthModal
                    redirectToAccount={true}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-auto w-auto p-1 group hover:bg-transparent [&_svg]:!size-6">
                        <User size={22} className="text-foreground group-hover:text-primary transition-colors" />
                      </Button>
                    } />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 py-2.5 bg-background/95 border-t border-border animate-in slide-in-from-top-2 duration-200 shadow-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setIsSearchOpen(false);
                setIsMobileSearchOpen(false);
                router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search millets, flours, combos..."
              className="pl-9 pr-10 w-full bg-muted/60 rounded-full text-xs sm:text-sm h-10 border border-border"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
              onClick={handleVoiceSearch}
            >
              <Mic className={cn("h-4 w-4 text-muted-foreground transition-colors", isListening && "text-red-500 animate-pulse")} />
            </Button>
          </form>
          {isSearchOpen && searchResults.length > 0 && (
            <div className="mt-2 p-2 bg-popover border rounded-xl shadow-lg">
              <ScrollArea className="max-h-60">
                <div className="space-y-1">
                  {searchResults.slice(0, 4).map(product => {
                    const categorySlug = slugify(product.category.split(',')[0]);
                    const productSlug = slugify(product.name);
                    return (
                      <Link
                        key={product.id}
                        href={`/collections/${categorySlug}/${productSlug}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/10"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setIsMobileSearchOpen(false);
                        }}
                      >
                        <Image src={product.imageUrl} alt={product.name} width={36} height={36} className="rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">₹{product.price.toFixed(2)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      <div className="hidden md:flex justify-center border-t">
        <DesktopNavContent />
      </div>
    </header >
  );
};

export default Header;
