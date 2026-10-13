
import { notFound } from 'next/navigation';
import { getProducts, getCategories } from '@/lib/data-async';
import CategoryClientPage from './CategoryClientPage';
import { Metadata } from 'next';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ categoryName: string }> }): Promise<Metadata> {
  const { categoryName } = await params;
  const isAll = categoryName.toLowerCase() === 'all';
  const allCategories = await getCategories();

  const category = isAll
    ? {
        id: 'all',
        name: 'All Millets & Superfoods',
        description: 'Explore our complete range of 100% natural, unpolished Shree Anna millets, freshly ground flours, and wholesome grains.',
      }
    : allCategories.find(c => c.id.toLowerCase() === categoryName.toLowerCase());

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  return {
    title: `${category.name} | Millet Yard - 100% Natural Millets`,
    description: category.description || `Explore our collection of ${category.name} at Millet Yard. 100% natural, unpolished millets, freshly ground flours, and wholesome grains.`,
    keywords: `${category.name}, millets, unpolished millets, healthy flours, gluten free, millet yard`,
    alternates: {
      canonical: `/collections/${categoryName}`,
    },
    openGraph: {
      title: `${category.name} | Millet Yard`,
      description: `Shop fresh ${category.name} online at Millet Yard with fast shipping across India.`,
      type: 'website',
      url: `/collections/${categoryName}`,
      siteName: 'Millet Yard',
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ categoryName: string }> }) {
  const { categoryName } = await params;
  const isAll = categoryName.toLowerCase() === 'all';

  const allProducts = await getProducts();
  const allCategories = await getCategories();

  const category = isAll
    ? {
        id: 'all',
        name: 'All Millets & Superfoods',
        description: 'Explore our complete range of 100% natural, unpolished Shree Anna millets, freshly ground flours, and wholesome grains.',
        imageUrl: '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png',
        imageHint: 'all products',
        linkUrl: '/collections/all',
        isFeatured: true,
      }
    : allCategories.find(c => c.id.toLowerCase() === categoryName.toLowerCase());

  if (!category) {
    notFound();
  }

  return <CategoryClientPage allProducts={allProducts} category={category} />;
}
