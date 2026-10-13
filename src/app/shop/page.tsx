
import { Suspense } from 'react';
import { getProducts, getTags } from '@/lib/data-async';
import ShopClientPage from './ShopClientPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results - 100% Pure Millets & Healthy Grains | Millet Yard',
  description: 'Search through our collection of unpolished millets, wholesome flours, and healthy combos.',
  keywords: 'search, millets, unpolished millets, ragi, foxtail, jowar, organic grains, millet yard',
  openGraph: {
    title: 'Search Millets & Healthy Flours',
    description: 'Search through our pure unpolished millets and combos at Millet Yard',
    type: 'website',
  },
};

export default async function ShopPage(props: { searchParams: Promise<{ search?: string }> }) {
  const searchParams = await props.searchParams;
  const allProducts = await getProducts();
  const tags = await getTags();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Loading products...</p>
        </div>
      </div>
    }>
      <ShopClientPage allProducts={allProducts} allTags={tags} searchQuery={searchParams?.search} />
    </Suspense>
  )
}
