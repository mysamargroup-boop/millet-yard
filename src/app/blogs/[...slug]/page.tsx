import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Home, ChevronRight, Calendar, User } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export const revalidate = 3600;

function getStoreData() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'milletyard_complete_store.json');
    if (fs.existsSync(jsonPath)) {
      const fileData = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(fileData);
    }
  } catch (e) {
    console.error('Error reading store data:', e);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const targetSlug = slug[slug.length - 1]; // last segment
  const store = getStoreData();
  const blog = store?.blogs?.find((b: any) => b.slug === targetSlug);

  if (!blog) {
    return {
      title: 'Blog Not Found | Millet Yard',
    };
  }

  return {
    title: `${blog.title} | Millet Yard Blog`,
    description: blog.excerpt || `Read ${blog.title} on Millet Yard.`,
    alternates: {
      canonical: `/blogs/${slug.join('/')}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: 'article',
      siteName: 'Millet Yard',
    },
  };
}

export default async function ShopifyBlogArticlePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const targetSlug = slug[slug.length - 1];
  const store = getStoreData();
  const blog = store?.blogs?.find((b: any) => b.slug === targetSlug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Link href="/" className="flex items-center gap-1 hover:text-primary">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/blog" className="hover:text-primary">
            Blogs
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-xs">{blog.title}</span>
        </nav>
      </div>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-headline text-foreground mb-4">
            {blog.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> Millet Yard Team</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Health & Millets</span>
          </div>
        </header>

        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-sans"
          dangerouslySetInnerHTML={{ __html: blog.body_html || `<p>${blog.title} article content.</p>` }}
        />

        <div className="mt-12 pt-8 border-t flex justify-between items-center">
          <Link href="/blog" className="text-primary font-medium hover:underline">
            ← Back to All Articles
          </Link>
          <Link href="/products/barnyard-millet-atta-100-natural-freshly-ground-barnyard-millet-flour" className="text-primary font-medium hover:underline">
            Explore Millet Products →
          </Link>
        </div>
      </article>
    </div>
  );
}
