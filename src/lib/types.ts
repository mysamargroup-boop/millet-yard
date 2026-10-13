

declare global {
  interface Window {
    Cashfree?: any;
    dataLayer: any[];
  }
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // The effective selling price (min of regular and sale)
  regularPrice?: number; // The maximum retail price (MRP)
  salePrice?: number; // The discounted price (if applicable)
  costPrice?: number; // The cost of goods sold (COGS)
  imageUrl: string;
  imageAlt?: string;
  imageHint?: string;
  galleryImages?: string[];
  videoUrl?: string;
  imageAttribution?: string;
  license?: string;
  category: string;
  subCategory?: string;
  tags?: string[];
  material?: string;
  color?: string; // Legacy/Simple color field
  colorOptions?: { name: string; value: string }[]; // Legacy color options
  options?: ProductOption[];
  variants?: ProductVariant[];
  badge?: 'Best Seller' | 'New' | 'Limited' | 'Trending' | 'Sale' | 'Hot' | 'Exclusive' | 'Premium' | 'Featured' | 'Popular' | string;
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
  specificDescription?: string;
  features: string[];
  inventory: number;
  allowImageUpload?: boolean;
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  weight?: number;
  weightUnit?: string;
  dimensions?: { length: number; width: number; height: number; unit: string };
  dimensionUnit?: string;
  media_url_1?: string;
  media_url_2?: string;
  media_url_3?: string;
  isActive?: boolean;
}

export interface ProductOption {
  id: string;
  name: string; // e.g. "Color", "Weight"
  values: string[]; // e.g. ["Red", "Blue"] or ["500g", "1kg"]
}

export interface ProductVariant {
  id: string;
  title: string; // e.g. "Red / 500g"
  price: number;
  salePrice?: number | null;
  stock: number;
  sku?: string;
  options: Record<string, string>; // { "Color": "Red", "Weight": "500g" }
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  imageHint: string;
  linkUrl?: string;
  is_featured?: boolean;
  featured_order?: number;
  is_trending?: boolean;
  subcategories?: string[];
  size_guide_image_url?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  selectedOptions?: Record<string, string>;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unitCostPrice?: number; // Cost of goods at the time of order
  imageUrl?: string;
  imageHint?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  imageHint: string;
  author: string;
  content: string;
  imageKey: string;
}

export interface ProductsData {
  products: Product[];
}

export interface Order {
  id: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  paymentStatus?: string;
  shippingAddress?: string; // Legacy/Optional
  billingAddress?: string; // Legacy/Optional
  customerAddress?: string; // Main address field
}


export interface SiteImage {
  id: string;
  name?: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  linkUrl?: string;
  buttonText?: string;
  isVisible?: boolean;
}

export interface Video {
  id: string;
  type: 'instagram' | 'youtube';
  url: string;
  thumbnailUrl: string;
}

export interface SiteImageData {
  placeholderImages: SiteImage[];
  videos: Video[];
}

export interface CategoriesData {
  categories: Category[];
}

export interface SiteSettings {
  owner_first_name?: string;
  owner_last_name?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_hours?: string;
  maintenance_mode_enabled?: boolean;
  maintenance_mode_message?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_linkedin?: string;
  social_twitter?: string;
  home_meta_title?: string;
  home_meta_description?: string;
  google_verification_code?: string;
  google_tag_manager_id?: string;
  invoice_business_name?: string;
  invoice_business_address?: string;
  invoice_logo_url?: string;
  invoice_tax_percent?: number;
  invoice_currency_symbol?: string;
  invoice_gst_number?: string;
  invoice_phone?: string;
  invoice_email?: string;
  invoice_terms?: string;
  expected_delivery_min_days?: number;
  expected_delivery_max_days?: number;
  free_shipping_threshold?: number;
  promo_banner_enabled?: boolean;
  promo_banner_title?: string;
  promo_banner_subtitle?: string;
  timer_banner_enabled?: boolean;
  timer_banner_title?: string;
  timer_banner_image_url?: string;
  timer_banner_end_date?: string;
  theme_background?: string;
  theme_gradient?: string;
  theme_muted?: string;
  redirects?: string;
  whatsapp_only_checkout_enabled?: boolean;
  product_id_prefix?: string;
  hero_enabled?: boolean;
  hero_desktop_image_id?: string;
  hero_mobile_image_id?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_button_text?: string;
  hero_button_link?: string;
  bestsellers_enabled?: boolean;
  customer_login_enabled?: boolean;
  image_upload_provider?: 'supabase' | 'cloudinary';
  whatsapp_otp_template?: string;
  payment_gateway?: 'CASHFREE' | 'RAZORPAY' | 'STRIPE' | string;
  // COD Settings
  cod_enabled?: boolean;
  cod_min_order_amount?: number;
  cod_extra_fee?: number;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  active: boolean;
  show_on_offers_page: boolean;
}

export interface CouponsData {
  coupons: Coupon[];
}

export interface Subscription {
  id: string;
  name: string;
  phone: string;
  source?: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  comment: string;
  author_name: string;
  created_at: string;
  is_verified: boolean;
}

export interface SlidingCard {
  id: string;
  title: string;
  description: string;
  image_url: string;
  image_hint?: string;
  link_url?: string;
  order_num: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  content: string;
  rating: number;
  avatar_url?: string;
  is_visible: boolean;
  created_at: string;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  customer_name: string;
  question: string;
  answer?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface HomeBundle {
  products: Product[];
  categories: Category[];
  siteImages: SiteImage[];
  slidingCards: SlidingCard[];
  featuredCategories: Category[];
  videos: any[];
  testimonials: Testimonial[];
}
