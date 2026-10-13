
"use client";

import { useFormState } from "react-dom";
import { updateSiteSettings } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteSettings, SiteImage } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { CheckCircle, AlertCircle, Save, Info, Globe, ShoppingCart, Truck, CreditCard, Layout, Terminal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const initialState = {
  errors: {},
};

function hexToHsl(H: string) {
  if (!H) return '';
  let r = 0, g = 0, b = 0;
  if (H.length == 4) {
    r = parseInt("0x" + H[1] + H[1]);
    g = parseInt("0x" + H[2] + H[2]);
    b = parseInt("0x" + H[3] + H[3]);
  } else if (H.length == 7) {
    r = parseInt("0x" + H[1] + H[2]);
    g = parseInt("0x" + H[3] + H[4]);
    b = parseInt("0x" + H[5] + H[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

const SeoScoreIndicator = ({ score }: { score: number; }) => {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor = score > 80 ? '#22c55e' : score > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative h-10 w-10 flex-shrink-0 group cursor-help">
      <svg className="transform -rotate-90" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" strokeWidth="3" stroke="currentColor" fill="transparent" className="text-white/10" />
        <circle
          cx="20" cy="20" r="18"
          stroke={strokeColor}
          fill="transparent"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}</span>
      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-48 bg-black/80 backdrop-blur-md rounded-md p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 glass-panel">
        SEO Score based on meta title, description, and verifications.
      </div>
    </div>
  );
};


const ColorPicker = ({ label, name, defaultValue, defaultHsl }: { label: string, name: string, defaultValue: string, defaultHsl: string }) => {
  const [color, setColor] = useState(defaultValue);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const hsl = hexToHsl(hex);
    setColor(hsl);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input id={name} name={name} value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. 0 0% 98%" className="glass-input" />
        <div className="relative h-10 w-10 rounded-full border border-white/20 p-1 flex-shrink-0 overflow-hidden">
          <div className="w-full h-full rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: `hsl(${color})` }} />
          <input type="color" onChange={handleColorChange} className="absolute inset-0 w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-0 cursor-pointer" />
        </div>
        <Button type="button" variant="outline" onClick={() => setColor(defaultHsl)} className="glass-input hover:bg-white/10">Reset</Button>
      </div>
      <p className="text-xs text-muted-foreground">Enter HSL values or use the circle to pick a color.</p>
    </div>
  )
}

const PRESET_THEMES = [
  { name: 'Custom / Solid', value: '', class: 'bg-white border-2' },
  { name: 'Electronics (Blue)', value: 'linear-gradient(135deg, #f0f9ff 0%, #cbebff 100%)', class: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { name: 'Fashion (Pink)', value: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)', class: 'bg-gradient-to-br from-rose-400 to-pink-500' },
  { name: 'Nature (Green)', value: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', class: 'bg-gradient-to-br from-green-400 to-emerald-600' },
  { name: 'Luxury (Gold)', value: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', class: 'bg-gradient-to-br from-amber-300 to-amber-500' },
  { name: 'Minimal (Gray)', value: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', class: 'bg-gradient-to-br from-gray-300 to-gray-500' },
  { name: 'Vibrant (Purple)', value: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', class: 'bg-gradient-to-br from-purple-400 to-purple-600' },
];

const GradientPicker = ({ name, defaultValue }: { name: string, defaultValue: string }) => {
  const [selected, setSelected] = useState(defaultValue || '');

  return (
    <div className="grid gap-3">
      <Label>Website Tone / Theme</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRESET_THEMES.map((theme) => (
          <div
            key={theme.name}
            className={cn(
              "cursor-pointer rounded-xl p-3 text-xs font-medium transition-all border flex flex-col items-center gap-2 text-center group relative overflow-hidden",
              selected === theme.value ? "border-[#137fec] bg-[#137fec]/10" : "border-white/10 hover:border-white/20 bg-white/5"
            )}
            onClick={() => setSelected(theme.value)}
          >
            <div className={cn("w-full h-8 rounded-md shadow-sm opacity-80 group-hover:opacity-100 transition-opacity", theme.class)} />
            <span>{theme.name}</span>
            {selected === theme.value && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#137fec]" />
            )}
          </div>
        ))}
      </div>
      <input type="hidden" name={name} value={selected} />
      <p className="text-[10px] text-muted-foreground mt-1">
        This sets the background gradient for the main site. Choose "Custom" to use a solid background color.
      </p>
    </div>
  );
};

export default function SettingsForm({ settings, mode = 'all', siteImages = [] }: { settings: SiteSettings, mode?: 'all' | 'invoiceOnly' | 'bannersOnly' | 'generalOnly' | 'redirectsOnly', siteImages?: SiteImage[] }) {
  const [state, formAction] = useFormState(updateSiteSettings, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
      } else {
        toast({ title: "Error", description: state.message, variant: "destructive" });
      }
    }
  }, [state, toast]);

  const showGeneral = mode === 'all' || mode === 'generalOnly';
  const showInvoice = mode === 'all' || mode === 'invoiceOnly';
  const showBanners = mode === 'all' || mode === 'bannersOnly';
  const showRedirects = mode === 'all' || mode === 'redirectsOnly';

  const calculateSeoScore = () => {
    let score = 0;
    if (settings.home_meta_title) score += 40;
    if (settings.home_meta_description) score += 40;
    if (settings.google_verification_code) score += 10;
    if (settings.google_tag_manager_id) score += 10;
    return score;
  };
  const seoScore = useMemo(calculateSeoScore, [settings]);

  return (
    <form action={formAction}>
      <input type="hidden" name="_mode" value={mode} />
      <div className="grid gap-8">
        {showGeneral && (
          <>
            <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <Globe className="h-5 w-5 text-[#137fec]" />
                <h3 className="text-lg font-semibold">Branding & Contact</h3>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input id="logo_url" name="logo_url" defaultValue={settings.logo_url || ''} placeholder="https://..." className="glass-input" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="owner_first_name">Owner First Name</Label>
                    <Input id="owner_first_name" name="owner_first_name" defaultValue={settings.owner_first_name || ''} placeholder="e.g. Rahul" className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="owner_last_name">Owner Last Name</Label>
                    <Input id="owner_last_name" name="owner_last_name" defaultValue={settings.owner_last_name || ''} placeholder="e.g. Sharma" className="glass-input" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="contact_email">Support Email</Label>
                    <Input id="contact_email" name="contact_email" defaultValue={settings.contact_email || ''} className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact_phone">Support Phone</Label>
                    <Input id="contact_phone" name="contact_phone" defaultValue={settings.contact_phone || ''} className="glass-input" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_address">Business Address</Label>
                  <Textarea id="contact_address" name="contact_address" defaultValue={settings.contact_address || ''} className="glass-input min-h-[80px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="product_id_prefix">Product ID Prefix</Label>
                    <Input
                      id="product_id_prefix"
                      name="product_id_prefix"
                      defaultValue={settings.product_id_prefix || 'PR'}
                      maxLength={2}
                      placeholder="e.g. PR"
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                      }}
                      className="glass-input"
                    />
                    <p className="text-[10px] text-muted-foreground">Used for generating new product IDs (e.g. PR001). Must be 2 capital letters.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact_hours">Business Hours (Optional)</Label>
                    <Input id="contact_hours" name="contact_hours" defaultValue={settings.contact_hours || ''} placeholder="e.g. Mon-Fri 9am-6pm" className="glass-input" />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> Maintenance Mode
                  </h4>
                  <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/5">
                    <Switch id="maintenance_mode_enabled" name="maintenance_mode_enabled" defaultChecked={settings.maintenance_mode_enabled} />
                    <Label htmlFor="maintenance_mode_enabled" className="cursor-pointer">Enable Maintenance Mode</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maintenance_mode_message">Maintenance Message</Label>
                    <Input id="maintenance_mode_message" name="maintenance_mode_message" defaultValue={settings.maintenance_mode_message || ''} placeholder="We'll be back soon!" className="glass-input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <Layout className="h-5 w-5 text-[#137fec]" />
                <h3 className="text-lg font-semibold">Theme Settings</h3>
              </div>
              <div className="space-y-6">
                <GradientPicker name="theme_gradient" defaultValue={settings.theme_gradient || ''} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <ColorPicker
                    label="Background Color (Fallback/Solid)"
                    name="theme_background"
                    defaultValue={settings.theme_background || '0 0% 100%'}
                    defaultHsl="0 0% 100%"
                  />
                  <ColorPicker
                    label="Muted Background Color"
                    name="theme_muted"
                    defaultValue={settings.theme_muted || '210 40% 96.1%'}
                    defaultHsl="210 40% 96.1%"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <ImageIcon className="h-5 w-5 text-[#137fec]" />
                <h3 className="text-lg font-semibold">Hero Section</h3>
              </div>
              <div className="grid gap-6">
                <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/5">
                  <Switch id="hero_enabled" name="hero_enabled" defaultChecked={settings.hero_enabled} />
                  <Label htmlFor="hero_enabled" className="cursor-pointer">Enable Hero Banner</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hero_title">Title</Label>
                  <Input id="hero_title" name="hero_title" defaultValue={settings.hero_title || ''} className="glass-input" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hero_subtitle">Subtitle</Label>
                  <Input id="hero_subtitle" name="hero_subtitle" defaultValue={settings.hero_subtitle || ''} className="glass-input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hero_button_text">Button Text</Label>
                    <Input id="hero_button_text" name="hero_button_text" defaultValue={settings.hero_button_text || 'Shop Now'} className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hero_button_link">Button Link</Label>
                    <Input id="hero_button_link" name="hero_button_link" defaultValue={settings.hero_button_link || '/shop'} className="glass-input" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hero_desktop_image_id">Desktop Image</Label>
                  <Select name="hero_desktop_image_id" defaultValue={settings.hero_desktop_image_id || ''}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select an image" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Use Default)</SelectItem>
                      {siteImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          {img.name || img.description || img.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hero_mobile_image_id">Mobile Image</Label>
                  <Select name="hero_mobile_image_id" defaultValue={settings.hero_mobile_image_id || ''}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Same as Desktop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Same as Desktop</SelectItem>
                      {siteImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          {img.name || img.description || img.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner_effect">Banner Rain Effect</Label>
                  <Select name="banner_effect" defaultValue={settings.banner_effect || 'none'}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select Effect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Disabled)</SelectItem>
                      <SelectItem value="rain">Rain Effect (Mixed)</SelectItem>
                      <SelectItem value="heart">Heart Only</SelectItem>
                      <SelectItem value="star">Star Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Choose an animation effect for the homepage background.</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-[#137fec]" />
                  <h3 className="text-lg font-semibold">SEO Settings</h3>
                </div>
                <SeoScoreIndicator score={seoScore} />
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="home_meta_title">Meta Title</Label>
                  <Input id="home_meta_title" name="home_meta_title" defaultValue={settings.home_meta_title || ''} className="glass-input" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="home_meta_description">Meta Description</Label>
                  <Textarea id="home_meta_description" name="home_meta_description" defaultValue={settings.home_meta_description || ''} className="glass-input min-h-[80px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="social_facebook">Facebook URL</Label>
                    <Input id="social_facebook" name="social_facebook" defaultValue={settings.social_facebook || ''} className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="social_instagram">Instagram URL</Label>
                    <Input id="social_instagram" name="social_instagram" defaultValue={settings.social_instagram || ''} className="glass-input" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="social_twitter">Twitter URL</Label>
                    <Input id="social_twitter" name="social_twitter" defaultValue={settings.social_twitter || ''} className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="social_youtube">YouTube URL</Label>
                    <Input id="social_youtube" name="social_youtube" defaultValue={settings.social_youtube || ''} className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                    <Input id="social_linkedin" name="social_linkedin" defaultValue={settings.social_linkedin || ''} className="glass-input" />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-green-500 rounded-full"></span> External Verification
                  </h4>
                  <div className="grid gap-2">
                    <Label htmlFor="google_verification_code">Google Site Verification Code</Label>
                    <Input id="google_verification_code" name="google_verification_code" defaultValue={settings.google_verification_code || ''} placeholder="Enter Google verification code" className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                    <Input id="google_tag_manager_id" name="google_tag_manager_id" defaultValue={settings.google_tag_manager_id || ''} placeholder="GTM-XXXXXX" className="glass-input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <Truck className="h-5 w-5 text-[#137fec]" />
                <h3 className="text-lg font-semibold">Shipping & Delivery</h3>
              </div>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="expected_delivery_min_days">Min Delivery Days</Label>
                    <Input id="expected_delivery_min_days" name="expected_delivery_min_days" type="number" defaultValue={settings.expected_delivery_min_days || 7} className="glass-input" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expected_delivery_max_days">Max Delivery Days</Label>
                    <Input id="expected_delivery_max_days" name="expected_delivery_max_days" type="number" defaultValue={settings.expected_delivery_max_days || 15} className="glass-input" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="free_shipping_threshold">Free Shipping Threshold</Label>
                  <Input id="free_shipping_threshold" name="free_shipping_threshold" type="number" defaultValue={settings.free_shipping_threshold || 0} className="glass-input" />
                  <p className="text-[10px] text-muted-foreground">Orders above this amount get free shipping. Set to 0 to disable.</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <CreditCard className="h-5 w-5 text-[#137fec]" />
                <h3 className="text-lg font-semibold">Payment Settings</h3>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="payment_gateway">Active Payment Gateway</Label>
                  <Select name="payment_gateway" defaultValue={settings.payment_gateway || 'CASHFREE'}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select Gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASHFREE">Cashfree</SelectItem>
                      <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                      <SelectItem value="STRIPE">Stripe</SelectItem>
                      <SelectItem value="PAYU">PayU</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Select the provider to process checkout payments. Ensure keys are configured in environment variables.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {showInvoice && (
          <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <FileText className="h-5 w-5 text-[#137fec]" />
              <h3 className="text-lg font-semibold">Invoice Settings</h3>
            </div>
            <div className="grid gap-6">
              <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-yellow-500">
                      <strong>Abandoned Cart Recovery (WhatsApp):</strong> Template message is not yet ready. Please configure the template in your provider dashboard before enabling.
                    </p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10">
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 glass-panel">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">WhatsApp Template Guide</h4>
                        <p className="text-sm text-muted-foreground">
                          Your template must accept the following variables in order:
                        </p>
                        <ul className="text-sm list-disc pl-4 space-y-1 text-muted-foreground">
                          <li><strong>{`{{1}}`}</strong>: Customer Name</li>
                          <li><strong>{`{{2}}`}</strong>: Cart Items List</li>
                          <li><strong>{`{{3}}`}</strong>: Recovery Link</li>
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_business_name">Business Name</Label>
                <Input id="invoice_business_name" name="invoice_business_name" defaultValue={settings.invoice_business_name || ''} className="glass-input" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_business_address">Business Address</Label>
                <Textarea id="invoice_business_address" name="invoice_business_address" defaultValue={settings.invoice_business_address || ''} className="glass-input min-h-[80px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="invoice_phone">Invoice Phone (Optional)</Label>
                  <Input id="invoice_phone" name="invoice_phone" defaultValue={settings.invoice_phone || ''} placeholder="e.g. +91..." className="glass-input" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invoice_email">Invoice Email (Optional)</Label>
                  <Input id="invoice_email" name="invoice_email" type="email" defaultValue={settings.invoice_email || ''} placeholder="billing@..." className="glass-input" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_gst_number">GST Number</Label>
                <Input id="invoice_gst_number" name="invoice_gst_number" defaultValue={settings.invoice_gst_number || ''} className="glass-input" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="invoice_tax_percent">Tax (%)</Label>
                  <Input id="invoice_tax_percent" name="invoice_tax_percent" type="number" step="0.01" defaultValue={settings.invoice_tax_percent || 0} className="glass-input" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invoice_currency_symbol">Currency Symbol</Label>
                  <Input id="invoice_currency_symbol" name="invoice_currency_symbol" defaultValue={settings.invoice_currency_symbol || '₹'} className="glass-input" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_logo_url">Invoice Logo URL (Optional)</Label>
                <Input id="invoice_logo_url" name="invoice_logo_url" defaultValue={settings.invoice_logo_url || ''} placeholder="Defaults to main logo if empty" className="glass-input" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_terms">Invoice Terms & Conditions</Label>
                <Textarea id="invoice_terms" name="invoice_terms" defaultValue={settings.invoice_terms || ''} placeholder="e.g. No returns after 7 days..." className="glass-input min-h-[80px]" />
              </div>
            </div>
          </div>
        )}

        {showBanners && (
          <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Layout className="h-5 w-5 text-[#137fec]" />
              <h3 className="text-lg font-semibold">Promo Banners</h3>
            </div>
            <div className="grid gap-6">
              <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/5">
                <Switch id="promo_banner_enabled" name="promo_banner_enabled" defaultChecked={settings.promo_banner_enabled} />
                <Label htmlFor="promo_banner_enabled" className="cursor-pointer">Enable Top Promo Banner</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="promo_banner_title">Banner Title</Label>
                  <Input id="promo_banner_title" name="promo_banner_title" defaultValue={settings.promo_banner_title || ''} className="glass-input" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="promo_banner_subtitle">Banner Subtitle (Optional)</Label>
                  <Input id="promo_banner_subtitle" name="promo_banner_subtitle" defaultValue={settings.promo_banner_subtitle || ''} className="glass-input" />
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/5 mt-2">
                <Switch id="timer_banner_enabled" name="timer_banner_enabled" defaultChecked={settings.timer_banner_enabled} />
                <Label htmlFor="timer_banner_enabled" className="cursor-pointer">Enable Countdown Timer</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timer_banner_title">Timer Title</Label>
                <Input id="timer_banner_title" name="timer_banner_title" defaultValue={settings.timer_banner_title || ''} className="glass-input" />
              </div>
              <DateTimeField defaultValue={settings.timer_banner_end_date ? new Date(settings.timer_banner_end_date).toISOString() : ''} />
              <input type="hidden" name="timer_banner_end_date" id="timer_banner_end_date" />
            </div>
          </div>
        )}

        {showRedirects && (
          <div className="glass-card rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Terminal className="h-5 w-5 text-[#137fec]" />
              <h3 className="text-lg font-semibold">URL Redirects</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enter one redirect per line in the format: <code className="bg-white/10 px-1 py-0.5 rounded text-white text-xs">/old-path /new-path</code></p>
              <Textarea name="redirects" defaultValue={settings.redirects || ''} rows={10} className="glass-input font-mono text-xs" />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-white/10 mt-4">
          <Button type="submit" className="bg-[#137fec] hover:bg-[#0d6edb] text-white">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}

function formatDateTimeLocal(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour);
  d.setMinutes(minute);
  d.setSeconds(0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function DateTimeField({ defaultValue }: { defaultValue: string }) {
  const initial = (() => {
    try {
      return defaultValue ? new Date(defaultValue) : new Date();
    } catch {
      return new Date();
    }
  })();
  const [date, setDate] = useState<Date>(initial);
  const [hour, setHour] = useState<number>(initial.getHours());
  const [minute, setMinute] = useState<number>(initial.getMinutes());
  const display = `${date.toLocaleDateString()} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  useEffect(() => {
    const hiddenInput = document.getElementById('timer_banner_end_date') as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = formatDateTimeLocal(date, hour, minute);
    }
  }, [date, hour, minute]);

  return (
    <div className="grid gap-2">
      <Label>Timer End Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between glass-input font-normal hover:bg-white/5">
            {display}
            <span className="ml-2 text-muted-foreground text-xs">Change</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 glass-panel border-white/10">
          <div className="grid grid-cols-1 gap-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d: Date | undefined) => d && setDate(d)}
              className="rounded-md border border-white/10 bg-black/40"
            />
            <div className="flex gap-2">
              <div className="grid gap-1 flex-1">
                <Label className="text-xs">Hour</Label>
                <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
                  <SelectTrigger className="h-8 text-xs glass-input">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1 flex-1">
                <Label className="text-xs">Minute</Label>
                <Select value={String(minute)} onValueChange={(v) => setMinute(Number(v))}>
                  <SelectTrigger className="h-8 text-xs glass-input">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Additional icons imports needed
import { FileText, Search, ImageIcon } from "lucide-react";
