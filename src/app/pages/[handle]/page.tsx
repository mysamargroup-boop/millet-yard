import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
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

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const store = getStoreData();
  const page = store?.pages?.find((p: any) => p.handle === handle);

  if (!page) {
    return {
      title: 'Page Not Found | Millet Yard',
    };
  }

  return {
    title: `${page.title} | Millet Yard`,
    description: `Official ${page.title} page for Millet Yard.`,
    alternates: {
      canonical: `/pages/${handle}`,
    },
  };
}

export default async function StaticShopifyPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const store = getStoreData();
  const page = store?.pages?.find((p: any) => p.handle === handle);

  if (!page) {
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
          <span className="font-semibold text-foreground truncate">{page.title}</span>
        </nav>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold font-headline text-foreground mb-8 text-center">
          {page.title}
        </h1>

        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.body_html || `<p>${page.title} content coming soon.</p>` }}
        />
      </main>
    </div>
  );
}
