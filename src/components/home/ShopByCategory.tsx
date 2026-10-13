/**
 * SHOP BY CATEGORY SECTION
 * Shows the top 3 categories sorted by the number of products (most products first).
 * Requires both categories and products props.
 * Auto-hides if no categories or products are available.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, Product } from '@/lib/types';
import GradientHeading from '@/components/ui/GradientHeading';
import { ArrowRight, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShopByCategoryProps {
    categories: Category[];
    products: Product[];
}

const ShopByCategory = ({ categories, products }: ShopByCategoryProps) => {
    if (!categories || categories.length === 0 || !products || products.length === 0) {
        return null;
    }

    // Count products per category and sort by count (most products first)
    const categoriesWithCount = categories
        .map(cat => {
            const productCount = products.filter(p => {
                const pCat = String(p.category || (p as any).category_id || '').toLowerCase().trim();
                const cId = String(cat.id || '').toLowerCase().trim();
                const cName = String(cat.name || '').toLowerCase().trim();

                return pCat === cId ||
                    pCat === cName ||
                    (pCat && pCat.split(',').map(s => s.trim().toLowerCase()).includes(cId));
            }).length;
            return { ...cat, productCount };
        })
        .filter(cat => cat.productCount > 0) // Only categories that have at least 1 product
        .sort((a, b) => b.productCount - a.productCount) // Most products first
        .slice(0, 3); // Top 3

    if (categoriesWithCount.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="text-left mb-8">
                    <GradientHeading
                        icon="LayoutGrid"
                        title="Shop By Category"
                        subtitle="Explore our pure range of unpolished Shree Anna millets, cold stone-ground flours, and superfoods."
                        variant="left"
                        size="lg"
                        className="mb-0"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {categoriesWithCount.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                        >
                            <Link
                                href={category.linkUrl || `/collections/${category.id}`}
                                className="group relative block overflow-hidden rounded-3xl bg-card border border-border/50 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/20 transition-all duration-500"
                            >
                                {/* Image Container */}
                                <div className="relative h-[280px] md:h-[320px] overflow-hidden bg-emerald-950/20">
                                    <Image
                                        src={category.imageUrl || '/images/products/copy-of-foxtail-millet-shreeanna-500-gram/image_1.png'}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                </div>

                                {/* Floating Content Card */}
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <div className="bg-background/80 backdrop-blur-lg rounded-2xl p-5 border border-primary/10 shadow-2xl shadow-black/10 transform transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-3xl group-hover:shadow-black/20">
                                        {/* Icon Badge */}
                                        <div className="absolute -top-5 left-5 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                                            <Tag className="w-5 h-5 text-primary-foreground" />
                                        </div>

                                        <h3 className="text-xl font-bold font-headline text-foreground mt-2 mb-2 group-hover:text-primary transition-colors">
                                            {category.name}
                                        </h3>

                                        {category.description && (
                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                                {category.description}
                                            </p>
                                        )}

                                        <div className="flex items-center text-primary font-semibold text-sm">
                                            <span>Explore</span>
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShopByCategory;

