"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Filter, Star, Package, Sparkles, TrendingUp, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function ShopClientPage({ allProducts, allTags, searchQuery }: { allProducts: Product[], allTags: string[], searchQuery?: string }) {
  const searchParams = useSearchParams();

  const [sort, setSort] = useState('relevance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(allProducts);

  // Calculate dynamic price range safely
  const { minPrice, maxPrice } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return { minPrice: 0, maxPrice: 1000 };
    const validPrices = allProducts.map(p => Number(p.price) || 0).filter(p => !isNaN(p) && p > 0);
    if (validPrices.length === 0) return { minPrice: 0, maxPrice: 1000 };
    return {
      minPrice: Math.floor(Math.min(...validPrices)),
      maxPrice: Math.ceil(Math.max(...validPrices))
    };
  }, [allProducts]);

  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Get unique categories
  const allCategories = [...new Set(allProducts.flatMap(p => p.category?.split(',').map(c => c.trim()) || []))].filter(Boolean);

  // Count products per tag
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = allProducts.filter(p => p.tags?.includes(tag)).length;
    return acc;
  }, {} as Record<string, number>);

  // Count products per category
  const categoryCounts = allCategories.reduce((acc, cat) => {
    acc[cat] = allProducts.filter(p => p.category?.includes(cat)).length;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    const priceQuery = searchParams?.get('price');
    if (priceQuery) {
      const maxPrice = parseInt(priceQuery, 10);
      if (!isNaN(maxPrice)) {
        setPriceRange([0, maxPrice]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let products = allProducts;

    // Search filter
    const query = searchQuery || searchParams?.get('search');
    if (query) {
      const lowerQuery = query.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
      );
    }

    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedTags.length > 0) {
      products = products.filter(p => p.tags?.some(tag => selectedTags.includes(tag)));
    }

    if (selectedCategories.length > 0) {
      products = products.filter(p => selectedCategories.some(cat => p.category?.includes(cat)));
    }

    if (inStockOnly) {
      products = products.filter(p => p.inventory === undefined || p.inventory > 0);
    }

    if (onSaleOnly) {
      products = products.filter(p => p.salePrice && p.regularPrice && p.salePrice < p.regularPrice);
    }

    switch (sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: // 'relevance'
        break;
    }
    setFilteredProducts(products);

  }, [sort, priceRange, selectedTags, selectedCategories, inStockOnly, onSaleOnly, allProducts, searchParams]);

  const handleTagChange = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedTags([]);
    setSelectedCategories([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSort('relevance');
  };

  const activeFiltersCount = selectedTags.length + selectedCategories.length + (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0);

  const renderFilterSidebar = (isMobile = false) => (
    <aside
      className={cn(
        "w-full space-y-4",
        isMobile
          ? "pb-4"
          : "md:w-72 lg:w-80 md:pr-6 md:mr-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pb-10 relative"
      )}
      style={!isMobile ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
    >
      {/* Decorative background elements */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl -z-10" aria-hidden="true">
          <div className="absolute -top-6 -right-6 w-[140px] h-[140px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }} />
          <div className="absolute bottom-[20%] -left-4 w-[100px] h-[100px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
          <svg className="absolute top-[40%] right-2 w-[60px] h-[60px] opacity-[0.04]" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="25" stroke="#10b981" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="12" stroke="#10b981" strokeWidth="0.3" />
          </svg>
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '14px 14px' }} />
        </div>
      )}

      {/* Gradient accent strip at top */}
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-emerald-400/40 via-primary/30 to-blue-400/40 mb-2" />

      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-primary/5 rounded-lg border border-primary/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-destructive hover:text-destructive/80 h-7 px-2">
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
          <Sparkles className="h-4 w-4 text-primary" /> Quick Filters
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id={isMobile ? "in-stock-m" : "in-stock"}
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(checked === true)}
            />
            <Label htmlFor={isMobile ? "in-stock-m" : "in-stock"} className="font-medium text-sm cursor-pointer flex items-center gap-2 select-none">
              <Package className="h-4 w-4 text-green-600" /> In Stock Only
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id={isMobile ? "on-sale-m" : "on-sale"}
              checked={onSaleOnly}
              onCheckedChange={(checked) => setOnSaleOnly(checked === true)}
            />
            <Label htmlFor={isMobile ? "on-sale-m" : "on-sale"} className="font-medium text-sm cursor-pointer flex items-center gap-2 select-none">
              <TrendingUp className="h-4 w-4 text-red-600" /> On Sale
            </Label>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="p-4 bg-muted/30 rounded-lg border">
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
          Price Range
        </h4>
        <Slider
          value={priceRange}
          min={minPrice}
          max={maxPrice}
          step={10}
          onValueChange={(value) => setPriceRange(value)}
          className="mb-6 cursor-pointer"
        />
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Min</Label>
            <div className="flex items-center border rounded-md px-2 py-1.5 bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary/50">
              <span className="text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Math.max(minPrice, parseInt(e.target.value) || minPrice), priceRange[1]])}
                className="w-full text-sm bg-transparent border-none outline-none pl-1"
                min={minPrice}
                max={priceRange[1]}
              />
            </div>
          </div>
          <span className="text-muted-foreground mt-6">—</span>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Max</Label>
            <div className="flex items-center border rounded-md px-2 py-1.5 bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary/50">
              <span className="text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Math.min(maxPrice, parseInt(e.target.value) || maxPrice)])}
                className="w-full text-sm bg-transparent border-none outline-none pl-1"
                min={priceRange[0]}
                max={maxPrice}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[100, 250, 500, 1000].filter(p => p <= maxPrice && p >= minPrice).map(price => (
            <Button
              key={price}
              variant={priceRange[1] === price && priceRange[0] === minPrice ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 rounded-sm"
              onClick={() => setPriceRange([minPrice, price])}
            >
              &lt; ₹{price}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {allCategories.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide opacity-80">Categories</h4>
          <ScrollArea className="h-56 pr-2">
            <div className="space-y-2.5">
              {allCategories.map(category => (
                <div key={category} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={isMobile ? `cat-m-${category}` : `cat-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <Label htmlFor={isMobile ? `cat-m-${category}` : `cat-${category}`} className="font-normal text-sm cursor-pointer select-none group-hover:text-primary transition-colors">{category}</Label>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 bg-background text-muted-foreground">{categoryCounts[category]}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide opacity-80">Tags</h4>
          <ScrollArea className="h-44 pr-2">
            <div className="space-y-2.5">
              {allTags.map(tag => (
                <div key={tag} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={isMobile ? `tag-m-${tag}` : `tag-${tag}`}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagChange(tag)}
                    />
                    <Label htmlFor={isMobile ? `tag-m-${tag}` : `tag-${tag}`} className="font-normal text-sm cursor-pointer select-none group-hover:text-primary transition-colors capitalize">{tag}</Label>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 bg-background text-muted-foreground">{tagCounts[tag]}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </aside>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Shop</p>
        <h1 className="text-4xl font-headline font-bold text-center">All Products</h1>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block">
          {renderFilterSidebar(false)}
        </div>

        <main className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="md:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 border-emerald-600/30 text-emerald-950 dark:text-emerald-100 font-medium">
                    <Filter className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[11px] h-5 px-1.5 font-bold">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] sm:max-w-md p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-base font-bold font-headline flex items-center gap-2">
                        <Filter className="h-4 w-4 text-emerald-700" />
                        Filter Products
                      </SheetTitle>
                      {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-destructive hover:text-destructive/80 h-7 px-2">
                          <X className="h-3 w-3 mr-1" /> Reset
                        </Button>
                      )}
                    </div>
                    <SheetDescription className="sr-only">Filter shop products by category, price, and tags</SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {renderFilterSidebar(true)}
                  </div>
                  <div className="p-4 border-t bg-background/95 backdrop-blur-sm flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      disabled={activeFiltersCount === 0}
                      className="flex-1 text-xs"
                    >
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setMobileFiltersOpen(false)}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                    >
                      Show {filteredProducts.length} Products
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Showing</span>
              <div className="flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold shadow-sm">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            <Select onValueChange={setSort} defaultValue="relevance">
              <SelectTrigger className="w-[170px] h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Alphabetical: A-Z</SelectItem>
                <SelectItem value="name-desc">Alphabetical: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Pills Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5 p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
              <span className="font-semibold text-muted-foreground mr-1 text-[11px] uppercase tracking-wider">Active:</span>
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {cat}
                  <button onClick={() => handleCategoryChange(cat)} className="hover:bg-emerald-200/60 rounded-full p-0.5 ml-0.5" aria-label={`Remove ${cat}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                  #{tag}
                  <button onClick={() => handleTagChange(tag)} className="hover:bg-blue-200/60 rounded-full p-0.5 ml-0.5" aria-label={`Remove ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {inStockOnly && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-green-50 text-green-900 border border-green-200 dark:bg-green-950/40 dark:text-green-300">
                  In Stock
                  <button onClick={() => setInStockOnly(false)} className="hover:bg-green-200/60 rounded-full p-0.5 ml-0.5" aria-label="Remove in stock filter">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {onSaleOnly && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
                  On Sale
                  <button onClick={() => setOnSaleOnly(false)} className="hover:bg-red-200/60 rounded-full p-0.5 ml-0.5" aria-label="Remove on sale filter">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                  ₹{priceRange[0]} - ₹{priceRange[1]}
                  <button onClick={() => setPriceRange([minPrice, maxPrice])} className="hover:bg-amber-200/60 rounded-full p-0.5 ml-0.5" aria-label="Reset price filter">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-destructive hover:underline font-semibold ml-auto text-xs py-1 px-2"
              >
                Clear All
              </button>
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-dashed border-2 rounded-lg">
              <h2 className="text-2xl font-semibold">No Products Found</h2>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters.</p>
              <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4">
                Reset All Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
