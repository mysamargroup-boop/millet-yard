
"use client";

import { updateProductsBulk } from "@/lib/actions";
import { Product, Category } from "@/lib/types";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-[#137fec] hover:bg-[#0d6edb]">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {pending ? "Saving..." : "Save All Changes"}
        </Button>
    );
}

const BADGE_OPTIONS = [
    { value: "none", label: "None" },
    { value: "Best Seller", label: "Best Seller" },
    { value: "New", label: "New" },
    { value: "Trending", label: "Trending" },
    { value: "Sale", label: "Sale" },
    { value: "Hot", label: "Hot" },
    { value: "Limited", label: "Limited" },
    { value: "Exclusive", label: "Exclusive" },
    { value: "Premium", label: "Premium" },
    { value: "Featured", label: "Featured" },
    { value: "Popular", label: "Popular" },
];

export function BulkEditTable({ products, categories }: { products: Product[]; categories: Category[] }) {
    // @ts-ignore
    const [state, formAction] = useActionState(updateProductsBulk, {});

    return (
        <form action={formAction}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Bulk Edit Products</h2>
                <SubmitButton />
            </div>

            {state.success && (
                <div className="p-4 mb-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span>{state.message || "Successfully updated products!"}</span>
                </div>
            )}
            {state.errors?._form && (
                <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{state.errors._form[0]}</span>
                </div>
            )}

            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[50px]">Img</TableHead>
                            <TableHead className="min-w-[180px]">Name</TableHead>
                            <TableHead className="min-w-[150px]">Category</TableHead>
                            <TableHead className="w-[120px]">Regular Price</TableHead>
                            <TableHead className="w-[120px]">Sale Price</TableHead>
                            <TableHead className="w-[90px]">Inventory</TableHead>
                            <TableHead className="min-w-[130px]">Badge</TableHead>
                            <TableHead className="w-[80px] text-center">Active</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id} className="hover:bg-muted/30">
                                <TableCell>
                                    <div className="relative h-10 w-10">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover rounded"
                                        />
                                    </div>
                                    <input type="hidden" name={`id_${product.id}`} value={product.id} />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        name={`name_${product.id}`}
                                        defaultValue={product.name}
                                        className="text-sm h-9"
                                    />
                                    <div className="text-[10px] text-muted-foreground mt-1 font-mono">{product.id}</div>
                                </TableCell>
                                <TableCell>
                                    <Select name={`category_${product.id}`} defaultValue={product.category}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        name={`reqPrice_${product.id}`}
                                        defaultValue={product.regularPrice}
                                        min="0"
                                        step="0.01"
                                        className="h-9 text-sm"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        name={`salePrice_${product.id}`}
                                        defaultValue={product.salePrice ?? ""}
                                        placeholder="None"
                                        min="0"
                                        step="0.01"
                                        className="h-9 text-sm"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        name={`inventory_${product.id}`}
                                        defaultValue={product.inventory}
                                        min="0"
                                        className="h-9 text-sm"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select name={`badge_${product.id}`} defaultValue={product.badge || "none"}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Badge" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BADGE_OPTIONS.map(b => (
                                                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch
                                        name={`status_${product.id}`}
                                        defaultChecked={product.isActive !== false}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </form>
    );
}
