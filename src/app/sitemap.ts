import { MetadataRoute } from 'next';
import { getProducts, getCategories, getBlogPosts } from '@/lib/data-async';
import fs from 'fs';
import path from 'path';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://milletyard.com';

  const staticRoutes = [
    '',
    '/shop',
    '/collections',
    '/pages/about-us',
    '/pages/contact',
    '/pages/our-story',
    '/pages/our-faming-products',
    '/blog',
    '/privacy',
    '/shipping',
    '/terms',
    '/returns-and-refunds'
  ].map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Canonical Shopify Product Routes (/products/[handle])
  const products = await getProducts();
  const productRoutes = products.map(product => ({
    url: `${siteUrl}/products/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Canonical Collection Routes (/collections/[handle])
  const categories = await getCategories();
  const categoryRoutes = categories.map(category => ({
    url: `${siteUrl}/collections/${category.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Canonical Blog Routes (/blogs/[slug])
  const blogPosts = await getBlogPosts();
  const blogRoutes = blogPosts.map(post => ({
    url: `${siteUrl}/blogs/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...blogRoutes,
  ];
}
