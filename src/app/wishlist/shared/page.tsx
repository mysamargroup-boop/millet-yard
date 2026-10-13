'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
}

function SharedWishlistContent() {
    const searchParams = useSearchParams();
    const data = searchParams.get('data');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadProducts() {
            if (!data) {
                setError('No wishlist data provided');
                setLoading(false);
                return;
            }

            try {
                // Decode the base64 data
                const decoded = atob(data);
                const productIds: string[] = JSON.parse(decoded);

                if (!Array.isArray(productIds) || productIds.length === 0) {
                    setError('Invalid wishlist data');
                    setLoading(false);
                    return;
                }

                // Fetch products from API
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error('Failed to fetch products');

                const allProducts = await response.json();

                // Filter to only include products in the wishlist
                const wishlistProducts = allProducts.filter((p: any) =>
                    productIds.includes(p.id)
                ).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: p.sale_price || p.regular_price || p.price,
                    imageUrl: p.image_url || p.imageUrl,
                    category: p.category_id || p.category
                }));

                setProducts(wishlistProducts);
            } catch (err) {
                console.error('Error loading shared wishlist:', err);
                setError('Failed to load wishlist');
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, [data]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Wishlist Not Found</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button asChild>
                    <Link href="/shop">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Products
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-8">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                <h1 className="text-3xl font-bold font-headline">Shared Wishlist</h1>
                <span className="text-muted-foreground">({products.length} items)</span>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">This wishlist is empty or items are no longer available</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product as any} />
                    ))}
                </div>
            )}

            <div className="mt-8 text-center">
                <Button asChild variant="outline">
                    <Link href="/shop">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Continue Shopping
                    </Link>
                </Button>
            </div>
        </div>
    );
}

export default function SharedWishlistPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            </div>
        }>
            <SharedWishlistContent />
        </Suspense>
    );
}
