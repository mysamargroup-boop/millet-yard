
'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/data-async";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, PlusCircle, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteCategoryAction } from "@/lib/actions";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const allCategories = await getCategories();
        setCategories(allCategories);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    const qq = q.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(qq) ||
      c.id.toLowerCase().includes(qq)
    );
  }, [categories, q]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading categories...' : `${filteredCategories.length} categories`}
          </p>
        </div>
        <Button
          asChild
          className="bg-[#137fec] hover:bg-[#0d6edb] px-3 py-2 h-9 text-xs sm:text-sm rounded-full sm:rounded-lg flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto"
        >
          <Link href="/sr-admin/categories/new">
            <PlusCircle className="mr-1 h-4 w-4" />
            <span>Add Category</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-border/20 dark:border-white/5">
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">ID (Slug)</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-12 w-12 bg-muted animate-pulse rounded-md" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-md ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                      data-ai-hint={category.imageHint}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      sizes="48px"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{category.id}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/sr-admin/categories/${category.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={category.id} />
                          <DropdownMenuItem asChild>
                            <button type="submit" className="w-full text-left text-destructive">Delete</button>
                          </DropdownMenuItem>
                        </form>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && filteredCategories.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No categories found. Add your first one to get started.</p>
        </div>
      )}
    </div>
  );
}
