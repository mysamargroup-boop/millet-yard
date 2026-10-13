import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://milletyard.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/sr-admin/', '/api/', '/account/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot'],
        allow: '/',
        disallow: ['/sr-admin/', '/api/'],
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
