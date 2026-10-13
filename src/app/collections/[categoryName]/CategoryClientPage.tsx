"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
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
import { Filter, Loader2, Sparkles, Package, TrendingUp, X, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Category, Product } from '@/lib/types';
import SubCategorySlider from '@/components/products/SubCategorySlider';

function CategoryClientPage({ allProducts, category }: { allProducts: Product[], category: Category }) {

  const [sort, setSort] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // New filters state
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categoryProducts = useMemo(() => {
    if (!category) return allProducts;
    if (category.id === 'all') return allProducts;
    return allProducts.filter(p =>
      p.category.split(',').map(c => c.trim().toLowerCase().replace(/ /g, '-')).includes(category.id.toLowerCase()) ||
      (p.subCategory && p.subCategory.toLowerCase() === category.id.toLowerCase())
    );
  }, [allProducts, category]);

  // Calculate dynamic price range based on category products
  const { minPrice, maxPrice } = useMemo(() => {
    if (categoryProducts.length === 0) return { minPrice: 0, maxPrice: 1000 };
    const prices = categoryProducts.map(p => p.price);
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [categoryProducts]);

  // Update price range when products change
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    categoryProducts.forEach(p => {
      p.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [categoryProducts]);

  // Count products per tag within this category
  const tagCounts = useMemo(() => {
    return availableTags.reduce((acc, tag) => {
      acc[tag] = categoryProducts.filter(p => p.tags?.includes(tag)).length;
      return acc;
    }, {} as Record<string, number>);
  }, [availableTags, categoryProducts]);

  const subcategories = useMemo(() => {
    const subs = new Map<string, string>();
    categoryProducts.forEach(p => {
      if (p.subCategory) {
        // Use the first product's image as the subcategory image
        if (!subs.has(p.subCategory)) {
          subs.set(p.subCategory, p.imageUrl);
        }
      }
    });
    return Array.from(subs.entries())
      .map(([name, image]) => ({ name, image }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryProducts]);

  useEffect(() => {
    setIsFiltering(true);
    // Simulate a short delay to allow the UI to update
    const timer = setTimeout(() => {
      let products = [...categoryProducts];

      if (selectedSubCategory) {
        products = products.filter(p => p.subCategory === selectedSubCategory);
      }

      products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

      if (selectedTags.length > 0) {
        products = products.filter(p => p.tags?.some(tag => selectedTags.includes(tag)));
      }

      if (inStockOnly) {
        products = products.filter(p => p.inventory === undefined || p.inventory > 0);
      }

      if (onSaleOnly) {
        products = products.filter(p => p.salePrice && p.regularPrice && p.salePrice < p.regularPrice);
      }

      if (minRating > 0) {
        products = products.filter(p => (p.rating || 0) >= minRating);
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
      setIsFiltering(false);
    }, 100); // Small delay for better UX

    return () => clearTimeout(timer);

  }, [sort, priceRange, selectedTags, categoryProducts, selectedSubCategory, inStockOnly, onSaleOnly, minRating]);

  const handleTagChange = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedTags([]);
    setSelectedSubCategory(null);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setMinRating(0);
    setSort('relevance');
  };

  const activeFiltersCount = selectedTags.length + (selectedSubCategory ? 1 : 0) + (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const renderFilterSidebar = (isMobile = false) => (
    <aside
      className={cn(
        "w-full space-y-4",
        isMobile
          ? "pb-4"
          : "md:w-72 lg:w-80 md:pr-2 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      )}
    >
      {/* Header with backdrop blur */}
      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10 backdrop-blur-sm">
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

      <Accordion type="multiple" defaultValue={['quick-filters', 'price', 'tags']} className="space-y-4">

        {/* Quick Filters */}
        <AccordionItem value="quick-filters" className="border-none">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
              <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                <Sparkles className="h-4 w-4 text-primary" /> Quick Filters
              </h4>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={isMobile ? "in-stock-cm" : "in-stock"}
                    checked={inStockOnly}
                    onCheckedChange={(checked) => setInStockOnly(checked === true)}
                  />
                  <Label htmlFor={isMobile ? "in-stock-cm" : "in-stock"} className="font-medium text-sm cursor-pointer flex items-center gap-2 select-none">
                    <Package className="h-4 w-4 text-green-600" /> In Stock Only
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={isMobile ? "on-sale-cm" : "on-sale"}
                    checked={onSaleOnly}
                    onCheckedChange={(checked) => setOnSaleOnly(checked === true)}
                  />
                  <Label htmlFor={isMobile ? "on-sale-cm" : "on-sale"} className="font-medium text-sm cursor-pointer flex items-center gap-2 select-none">
                    <TrendingUp className="h-4 w-4 text-red-600" /> On Sale
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-none">
          <div className="bg-muted/30 rounded-lg border overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                Price Range
              </h4>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <Slider
                defaultValue={[minPrice, maxPrice]}
                value={priceRange}
                min={minPrice}
                max={maxPrice}
                step={10}
                onValueChange={setPriceRange}
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
            </AccordionContent>
          </div>
        </AccordionItem>

        {/* Rating Filter */}
        <AccordionItem value="rating" className="border-none">
          <div className="bg-muted/30 rounded-lg border overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                Rating
              </h4>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <div
                    key={rating}
                    className={`flex items-center gap-2 cursor-pointer p-2 rounded-md transition-colors ${minRating === rating ? 'bg-primary/10' : 'hover:bg-muted'}`}
                    onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                  >
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">& Up</span>
                    {minRating === rating && <Badge variant="secondary" className="ml-auto text-[10px]">Selected</Badge>}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>

        {/* Tags */}
        {availableTags.length > 0 && (
          <AccordionItem value="tags" className="border-none">
            <div className="bg-muted/30 rounded-lg border overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                  Tags
                </h4>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <ScrollArea className="h-56 pr-2">
                  <div className="space-y-2.5">
                    {availableTags.map(tag => (
                      <div key={tag} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={isMobile ? `tag-cm-${tag}` : `tag-${tag}`}
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => handleTagChange(tag)}
                          />
                          <Label htmlFor={isMobile ? `tag-cm-${tag}` : `tag-${tag}`} className="font-normal text-sm cursor-pointer select-none group-hover:text-primary transition-colors capitalize">{tag}</Label>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 bg-background text-muted-foreground">{tagCounts[tag]}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </div>
          </AccordionItem>
        )}
      </Accordion>
    </aside>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Collections</p>
        <h1 className="text-4xl font-headline font-bold text-center">{category?.name}</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter Sidebar */}
        <div className="hidden md:block">
          {renderFilterSidebar(false)}
        </div>

        <div className="flex-1">
          <SubCategorySlider
            subcategories={subcategories}
            selectedSubCategory={selectedSubCategory}
            onSelect={setSelectedSubCategory}
          />

          <div className="flex flex-row justify-between items-center mb-4 gap-4">
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
                        Filter Collection
                      </SheetTitle>
                      {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-destructive hover:text-destructive/80 h-7 px-2">
                          <X className="h-3 w-3 mr-1" /> Reset
                        </Button>
                      )}
                    </div>
                    <SheetDescription className="sr-only">Filter products by price, rating, stock, and tags</SheetDescription>
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
              <SelectTrigger className="w-[140px] sm:w-[180px] h-10 text-xs sm:text-sm">
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
              {selectedSubCategory && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-purple-50 text-purple-900 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                  {selectedSubCategory}
                  <button onClick={() => setSelectedSubCategory(null)} className="hover:bg-purple-200/60 rounded-full p-0.5 ml-0.5" aria-label="Clear subcategory">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
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
              {minRating > 0 && (
                <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-yellow-50 text-yellow-900 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300">
                  ★ {minRating}+ Stars
                  <button onClick={() => setMinRating(0)} className="hover:bg-yellow-200/60 rounded-full p-0.5 ml-0.5" aria-label="Reset rating filter">
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

          {isFiltering ? (
            <div className="flex items-center justify-center min-h-[300px] text-center py-16 border-dashed border-2 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-0.5 sm:p-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-dashed border-2 rounded-lg">
              <h2 className="text-2xl font-semibold">No Products Found</h2>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function CategoryPageWrapper({ allProducts, category }: { allProducts: Product[], category: Category }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Loading collection...</p>
        </div>
      </div>
    }>
      <CategoryClientPage allProducts={allProducts} category={category} />
    </Suspense>
  )
}
