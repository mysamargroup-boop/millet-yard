import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductByName, getProducts, getCategories, getReviewsByProductId } from '@/lib/data-async';
import { Metadata } from 'next';
import ProductCard from '@/components/products/ProductCard';
import ProductLightbox from '@/components/products/ProductLightbox';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { Home, ChevronRight, CheckCircle2, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import ProductMediaGrid from '@/components/products/ProductMediaGrid';
import ProductReviewsNew from '@/components/products/ProductReviewsNew';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByName(handle);

  if (!product) {
    return {
      title: 'Product Not Found | Millet Yard',
      description: 'The requested millet product could not be found.',
    };
  }

  const title = `${product.name} | Millet Yard`;
  const rawDescription = product.shortDescription || product.description || `Buy 100% natural ${product.name} online at Millet Yard.`;
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').substring(0, 155);

  return {
    title,
    description: cleanDescription,
    alternates: {
      canonical: `/products/${handle}`,
    },
    openGraph: {
      title,
      description: cleanDescription,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
      siteName: 'Millet Yard',
    },
    keywords: product.tags && product.tags.length > 0 ? product.tags : ['Millets', 'Healthy Food', 'Millet Yard', 'Gluten Free'],
  };
}

export default async function ShopifyProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProductByName(handle);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  const recommendedProducts = allProducts
    .filter(p => p.id !== product.id)
    .sort((a, b) => {
      const aBest = a.badge === 'Best Seller' ? 1 : 0;
      const bBest = b.badge === 'Best Seller' ? 1 : 0;
      return bBest - aBest;
    })
    .slice(0, 5);

  const allImages = [product.imageUrl, ...(product.galleryImages || [])].filter(img => img && img.trim() !== '');
  if (allImages.length === 0) {
    allImages.push('/placeholder-image.svg');
  }

  const categories = await getCategories();
  const productCategory = categories.find(c => c.id === product.category || (product.category && c.name === product.category.split(',')[0].trim()));
  const sizeGuideImageUrl = productCategory?.size_guide_image_url || '';

  // Parse custom metafields (Health Benefits, Manufacturing, Shipping, Return Policy)
  let metafieldsMap: Record<string, string> = {};
  if (product.specificDescription) {
    try {
      metafieldsMap = JSON.parse(product.specificDescription);
    } catch {
      // not json
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://milletyard.com';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 300) : product.shortDescription,
    image: product.imageUrl ? [product.imageUrl] : [],
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Millet Yard'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.salePrice || product.price,
      availability: (product.inventory === undefined || product.inventory > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${handle}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.9,
      reviewCount: product.reviewCount || 28,
      bestRating: '5',
      worstRating: '1'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 pt-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto py-2">
          <Link href="/" className="flex items-center gap-1 hover:text-primary whitespace-nowrap">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/collections/all" className="hover:text-primary whitespace-nowrap">
            Shop
          </Link>
          {productCategory && (
            <>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <Link href={`/collections/${productCategory.id}`} className="hover:text-primary whitespace-nowrap">
                {productCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-[200px] md:max-w-md" title={product.name}>
            {product.name}
          </span>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Gallery / Lightbox */}
          <ProductLightbox images={allImages.map(img => ({ imageUrl: img, imageHint: product.imageHint || '' }))} product={product} />

          {/* Product Purchasing Box */}
          <div>
            <ProductDetailClient product={product} sizeGuideImageUrl={sizeGuideImageUrl} />
          </div>
        </div>

        {/* Media Highlights */}
        <ProductMediaGrid product={product} />

        {/* Customer Reviews */}
        <div className="max-w-4xl mx-auto mt-12">
          <ProductReviewsNew productId={product.id} productName={product.name} />
        </div>

        {/* Recommended Cross-Sells */}
        {recommendedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-headline font-bold text-center mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {recommendedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
