
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductByName, getProducts, getCategories, getReviewsByProductId } from '@/lib/data-async';
import { Metadata } from 'next';
import ProductCard from '@/components/products/ProductCard';

import ProductLightbox from '@/components/products/ProductLightbox';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { Home, ChevronRight } from 'lucide-react';
import { slugify } from '@/lib/utils';
import ProductMediaGrid from '@/components/products/ProductMediaGrid';
import ProductReviewsNew from '@/components/products/ProductReviewsNew';


export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ productId: string, categoryName: string }> }): Promise<Metadata> {
  const { productId, categoryName } = await params;
  const product = await getProductByName(productId);

  if (!product) {
    return {
      title: 'Product Not Found | Millet Yard',
      description: 'The requested product could not be found.',
    };
  }

  // User requested: "title me product title"
  const title = product.name;

  // User requested: "short description ke hi 150 characters use ho meta description me"
  // Fallback to description if shortDescription is missing
  const rawDescription = product.shortDescription || product.description || `Buy ${product.name} online at Millet Yard.`;
  // Clean HTML tags if any (basic check) and truncate
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').substring(0, 150);

  return {
    title,
    description: cleanDescription,
    alternates: {
      canonical: `/collections/${categoryName}/${productId}`,
    },
    openGraph: {
      title,
      description: cleanDescription,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
    },
    keywords: product.tags ? product.tags : [product.category, 'Millets', 'Organic Food', 'Millet Yard'],
  };
}

const Breadcrumbs = async ({ product }: { product: any }) => {
  const categories = await getCategories();
  const targetCat = (product.category || '').split(',')[0].trim().toLowerCase();
  const category = categories.find(c => 
    c.id.toLowerCase() === targetCat || 
    c.name.toLowerCase() === targetCat
  );

  return (
    <div className="container mx-auto px-4 pt-4">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="flex items-center gap-1 hover:text-primary">
          <Home className="h-4 w-4" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        {category && (
          <>
            <Link href={`/collections/${category.id}`} className="hover:text-primary whitespace-nowrap">
              {category.name}
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </>
        )}
        <span className="font-semibold text-foreground truncate" title={product.name}>{product.name}</span>
      </nav>
    </div>
  );
};


export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string, categoryName: string }> }) {
  const { productId, categoryName } = await params;
  const product = await getProductByName(productId);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  const recommendedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .sort((a, b) => {
      // Prioritize Best Sellers
      const aBest = a.badge === 'Best Seller' ? 1 : 0;
      const bBest = b.badge === 'Best Seller' ? 1 : 0;
      return bBest - aBest; // Descending
    })
    .slice(0, 5);

  const allImages = [product.imageUrl, ...(product.galleryImages || [])].filter(img => img && img.trim() !== '');

  // Ensure at least one image exists
  if (allImages.length === 0) {
    allImages.push('/placeholder-image.svg');
  }

  const initialReviews = await getReviewsByProductId(product.id);

  // Get size guide from category
  const categories = await getCategories();
  const productCategory = categories.find(c => product.category && c.name === product.category.split(',')[0].trim());
  const sizeGuideImageUrl = productCategory?.size_guide_image_url || '';

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://milletyard.com';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ? product.description.replace(/<[^>]*>/g, '') : product.shortDescription,
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
      url: `${siteUrl}/collections/${categoryName}/${productId}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.rating && product.reviewCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: '5',
        worstRating: '1'
      }
    } : {})
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs product={product} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Image Gallery */}
          <ProductLightbox images={allImages.map(img => ({ imageUrl: img, imageHint: product.imageHint || '' }))} product={product} />

          {/* Product Details */}
          <ProductDetailClient product={product} sizeGuideImageUrl={sizeGuideImageUrl} />
        </div>

        {/* Full Width Media Grid */}
        <ProductMediaGrid product={product} />

        {/* Centered Reviews */}
        <div className="max-w-4xl mx-auto mt-12">
          <ProductReviewsNew productId={product.id} productName={product.name} />
        </div>



        {recommendedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-headline font-bold text-center mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
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
