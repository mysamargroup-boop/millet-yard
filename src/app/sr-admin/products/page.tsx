
'use client';


import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProducts, getCategories, getTags } from "@/lib/data-async";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createProduct, deleteProductAction, bulkUpdateProductPrices, bulkAddTagToProducts } from "@/lib/actions";
import { MoreVertical, PlusCircle, Search, Download, Upload, FileSpreadsheet, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"none" | "price-asc" | "price-desc">("none");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [fetchedProducts, fetchedCategories, fetchedTags] = await Promise.all([
          getProducts(),
          getCategories(),
          getTags(),
        ]);
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setCategories(fetchedCategories);
        setAllTags(fetchedTags);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let tempProducts = products;

    if (searchTerm) {
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      if (selectedCategory === "low-stock") {
        tempProducts = tempProducts.filter(p => p.inventory < 5);
      } else {
        tempProducts = tempProducts.filter(p =>
          p.category.split(',').map(c => c.trim().toLowerCase()).includes(selectedCategory.toLowerCase())
        );
      }
    }

    if (sortOrder === "price-asc") {
      tempProducts = [...tempProducts].sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      tempProducts = [...tempProducts].sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(tempProducts);
  }, [searchTerm, selectedCategory, sortOrder, products]);

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      await Promise.all(selectedProducts.map(async (id) => {
        const fd = new FormData();
        fd.append('id', id);
        await deleteProductAction(fd as any);
      }));
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      toast({ title: "Deleted", description: "Selected products deleted successfully." });
    }
  }

  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      ID: p.id,
      Name: p.name,
      Category: p.category,
      RegularPrice: p.regularPrice,
      SalePrice: p.price !== p.regularPrice ? p.price : '',
      Inventory: p.inventory,
      ImageURL: p.imageUrl,
      Description: p.description,
      ShortDescription: p.shortDescription,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_export.xlsx");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let failCount = 0;

        for (const row of data as any[]) {
          const fd = new FormData();
          // Map CSV columns to FormData fields
          // Assuming columns: Name, Description, RegularPrice, SalePrice, Category, Inventory, ImageURL
          if (!row.Name || !row.Category || !row.RegularPrice || !row.ImageURL) {
            failCount++;
            continue;
          }

          const newId = crypto.randomUUID();
          fd.append('id', newId);
          fd.append('name', row.Name);
          fd.append('description', row.Description || row.Name); // Fallback
          fd.append('regularPrice', String(row.RegularPrice));
          if (row.SalePrice) fd.append('salePrice', String(row.SalePrice));
          fd.append('category', row.Category);
          fd.append('imageUrl', row.ImageURL);
          fd.append('inventory', String(row.Inventory || 0));

          // Defaults
          fd.append('shortDescription', row.ShortDescription || '');
          fd.append('imageAlt', row.Name);

          const result = await createProduct(null, fd);
          if (result?.success) {
            successCount++;
          } else {
            console.error("Failed import row", row, result?.errors);
            failCount++;
          }
        }

        toast({
          title: "Import Complete",
          description: `Imported: ${successCount}, Failed: ${failCount}`,
          variant: failCount > 0 ? "destructive" : "default",
        });

        // Refresh data
        setIsLoading(true);
        const [fetchedProducts] = await Promise.all([getProducts()]);
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setIsLoading(false);

      } catch (err) {
        console.error("Import error", err);
        toast({ title: "Import Failed", description: "Could not parse file.", variant: "destructive" });
        setIsImporting(false);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading inventory...' : `${filteredProducts.length} products in inventory`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" title="Import/Export Help">
                <Info className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] text-sm" align="end">
              <div className="space-y-3">
                <h4 className="font-bold text-base">📦 Import / Export Guide</h4>
                <div>
                  <p className="font-semibold text-primary mb-1">Export</p>
                  <p className="text-muted-foreground">Click <strong>Export</strong> to download all products as an <code>.xlsx</code> file. You can use the exported file as a template for importing.</p>
                </div>
                <div>
                  <p className="font-semibold text-primary mb-1">Import</p>
                  <p className="text-muted-foreground mb-2">Click <strong>Import</strong> and choose an <code>.xlsx</code> or <code>.csv</code> file. The file must have these columns:</p>
                  <div className="bg-muted/50 rounded-md p-2 text-xs space-y-1 font-mono">
                    <p><span className="text-green-600 font-bold">Required:</span> Name, Category, RegularPrice, ImageURL</p>
                    <p><span className="text-blue-500 font-bold">Optional:</span> SalePrice, Inventory, Description, ShortDescription</p>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[11px] text-muted-foreground">💡 <strong>Tip:</strong> First export your existing products, then edit the file and re-import to update in bulk. Product IDs are auto-generated on import.</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting || isLoading} className="glass-card flex-1 md:flex-none">
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isLoading || filteredProducts.length === 0} className="glass-card flex-1 md:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild className="bg-[#137fec] hover:bg-[#0d6edb] flex-1 md:flex-none">
            <Link href="/sr-admin/products/new"><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sr-admin/products/bulk-edit"><FileSpreadsheet className="h-5 w-5" /></Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="low-stock" className="text-destructive font-semibold">Low Stock (&lt; 5)</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name.toLowerCase()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v: "none" | "price-asc" | "price-desc") => setSortOrder(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sort: Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <form action={bulkUpdateProductPrices.bind(null, null) as any} className="flex items-center gap-2">
              <input type="hidden" name="ids" value={JSON.stringify(selectedProducts)} />
              <Select name="mode" defaultValue="increase">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
              <Input name="percent" type="number" step="0.1" placeholder="% change" className="w-[120px]" required />
              <Button type="submit" variant="secondary">Apply ({selectedProducts.length})</Button>
            </form>
            <form action={bulkAddTagToProducts.bind(null, null) as any} className="flex items-center gap-2">
              <input type="hidden" name="ids" value={JSON.stringify(selectedProducts)} />
              <Select value={selectedTag} onValueChange={setSelectedTag} name="tag">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary" disabled={!selectedTag}>Add Tag ({selectedProducts.length})</Button>
            </form>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete ({selectedProducts.length})
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        SEO: Title, description and product URL are used. The Short Description is used as meta description (keep ~140â€“160 chars). No separate meta title or slug.
      </p>
      <div className="glass-card rounded-xl overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-border/20 dark:border-white/5">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedProducts(checked ? filteredProducts.map(p => p.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Price</TableHead>
              <TableHead className="hidden sm:table-cell">Inventory</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-12 w-12 bg-muted animate-pulse rounded-md" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell className="hidden md:table-cell"><div className="h-6 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><div className="h-4 w-8 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => {
                        setSelectedProducts(
                          checked
                            ? [...selectedProducts, product.id]
                            : selectedProducts.filter((id) => id !== product.id)
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Image
                      src={product.imageUrl}
                      alt={product.imageAlt || product.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                      data-ai-hint={product.imageHint}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      sizes="48px"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline">{product.category}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell">â‚¹{product.price.toFixed(2)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={product.inventory < 5 ? "text-destructive font-bold flex items-center gap-1" : ""}>
                      {product.inventory}
                      {product.inventory < 5 && <span className="text-[10px] uppercase border border-destructive px-1 rounded">Low</span>}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-panel border-white/10 p-1">
                        <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-[#137fec]">
                          <Link href={`/sr-admin/products/${product.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="focus:bg-red-500/10 focus:text-red-400"
                        >
                          <form action={deleteProductAction} className="w-full">
                            <input type="hidden" name="id" value={product.id} />
                            <button
                              type="submit"
                              className="w-full text-left text-red-400 px-2 py-1.5 text-sm hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-sm"
                            >
                              Delete
                            </button>
                          </form>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No products found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
