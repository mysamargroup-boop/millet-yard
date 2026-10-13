"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, Trash2, RefreshCw } from "lucide-react";
import type { ProductOption, ProductVariant } from "@/lib/types";

interface ProductVariantsManagerProps {
    initialOptions: ProductOption[];
    initialVariants: ProductVariant[];
    basePrice: number;
    baseSalePrice: number;
    baseStock: number;
    onChange: (options: ProductOption[], variants: ProductVariant[]) => void;
}

export function ProductVariantsManager({
    initialOptions,
    initialVariants,
    basePrice,
    baseSalePrice,
    baseStock,
    onChange
}: ProductVariantsManagerProps) {
    const [options, setOptions] = useState<ProductOption[]>(initialOptions || []);
    const [variants, setVariants] = useState<ProductVariant[]>(initialVariants || []);

    // Local state for adding new option values
    const [newOptionName, setNewOptionName] = useState("");
    const [optionValuesInput, setOptionValuesInput] = useState<Record<string, string>>({});

    // Notify parent on change
    useEffect(() => {
        onChange(options, variants);
    }, [options, variants]); // eslint-disable-line react-hooks/exhaustive-deps

    const addOption = () => {
        if (!newOptionName.trim()) return;
        const newOption: ProductOption = {
            id: `opt_${Date.now()}`,
            name: newOptionName.trim(),
            values: []
        };
        setOptions([...options, newOption]);
        setNewOptionName("");
    };

    const removeOption = (id: string) => {
        setOptions(options.filter(o => o.id !== id));
    };

    const addValueToOption = (optionId: string) => {
        const val = optionValuesInput[optionId]?.trim();
        if (!val) return;

        setOptions(options.map(opt => {
            if (opt.id === optionId && !opt.values.includes(val)) {
                return { ...opt, values: [...opt.values, val] };
            }
            return opt;
        }));
        setOptionValuesInput({ ...optionValuesInput, [optionId]: "" });
    };

    const removeValueFromOption = (optionId: string, valueToRemove: string) => {
        setOptions(options.map(opt => {
            if (opt.id === optionId) {
                return { ...opt, values: opt.values.filter(v => v !== valueToRemove) };
            }
            return opt;
        }));
    };

    // Generate Variants based on options (Cartesian Product)
    const generateVariants = () => {
        if (options.length === 0) {
            setVariants([]);
            return;
        }

        // Helper to generate combinations
        const cartesian = (args: string[][]): string[][] => {
            const r: string[][] = [];
            const max = args.length - 1;
            function helper(arr: string[], i: number) {
                for (let j = 0, l = args[i].length; j < l; j++) {
                    const a = arr.slice(0); // clone arr
                    a.push(args[i][j]);
                    if (i === max) r.push(a);
                    else helper(a, i + 1);
                }
            }
            helper([], 0);
            return r;
        };

        // Prepare arrays of values
        const validOptions = options.filter(o => o.values.length > 0);
        if (validOptions.length === 0) return;

        const combinations = cartesian(validOptions.map(o => o.values));

        const newVariants: ProductVariant[] = combinations.map(combo => {
            const variantOptions: Record<string, string> = {};
            combo.forEach((val, idx) => {
                variantOptions[validOptions[idx].name] = val;
            });

            // Check if variant already exists to preserve price/stock
            const existing = variants.find(v =>
                JSON.stringify(v.options) === JSON.stringify(variantOptions)
            );

            return existing || {
                id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: combo.join(" / "),
                price: basePrice,
                stock: baseStock,
                options: variantOptions,
                salePrice: baseSalePrice || null
            };
        });

        setVariants(newVariants);
    };

    const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
        setVariants(variants.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ));
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-medium">1. Define Options</h3>
                <div className="flex gap-2">
                    <Input
                        placeholder="Option Name (e.g. Size, Color)"
                        value={newOptionName}
                        onChange={e => setNewOptionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <Button type="button" onClick={addOption} variant="secondary">Add Option Type</Button>
                </div>

                <div className="space-y-4 mt-4">
                    {options.map(opt => (
                        <Card key={opt.id} className="bg-muted/30">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold text-xs sm:text-sm">{opt.name}</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(opt.id)} className="text-destructive h-6 w-6 p-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {opt.values.map(val => (
                                        <Badge key={val} variant="secondary" className="pl-2 pr-1 py-0.5 sm:py-1 flex items-center gap-1 text-[10px] sm:text-xs">
                                            {val}
                                            <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeValueFromOption(opt.id, val)} />
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder={`Add value for ${opt.name}`}
                                        className="h-8 text-sm"
                                        value={optionValuesInput[opt.id] || ""}
                                        onChange={e => setOptionValuesInput({ ...optionValuesInput, [opt.id]: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValueToOption(opt.id))}
                                    />
                                    <Button type="button" size="sm" variant="outline" onClick={() => addValueToOption(opt.id)}>Add</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-medium">2. Variants Preview</h3>
                    <Button type="button" onClick={generateVariants} size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Generate Variants
                    </Button>
                </div>

                {variants.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-[10px] sm:text-xs">Variant</TableHead>
                                    <TableHead className="w-[80px] sm:w-[100px] text-[10px] sm:text-xs">Regular Price</TableHead>
                                    <TableHead className="w-[80px] sm:w-[100px] text-[10px] sm:text-xs">Sale Price</TableHead>
                                    <TableHead className="w-[60px] sm:w-[80px] text-[10px] sm:text-xs">Stock</TableHead>
                                    <TableHead className="w-[100px] sm:w-[120px] text-[10px] sm:text-xs">SKU</TableHead>
                                    <TableHead className="w-[40px] sm:w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map(v => (
                                    <TableRow key={v.id}>
                                        <TableCell className="font-medium text-[10px] sm:text-sm">{v.title}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-7 sm:h-8 w-16 sm:w-24 text-[10px] sm:text-sm"
                                                value={v.price}
                                                onChange={e => updateVariant(v.id, 'price', Number(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-7 sm:h-8 w-16 sm:w-24 text-[10px] sm:text-sm"
                                                placeholder="-"
                                                value={v.salePrice || ''}
                                                onChange={e => updateVariant(v.id, 'salePrice', e.target.value ? Number(e.target.value) : null)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-7 sm:h-8 w-14 sm:w-20 text-[10px] sm:text-sm"
                                                value={v.stock}
                                                onChange={e => updateVariant(v.id, 'stock', Number(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                className="h-7 sm:h-8 w-24 sm:w-32 text-[10px] sm:text-sm"
                                                value={v.sku || ''}
                                                placeholder="SKU"
                                                onChange={e => updateVariant(v.id, 'sku', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setVariants(variants.filter(x => x.id !== v.id))}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Define options above and click "Generate Variants" to create combinations.
                    </p>
                )}
            </div>
        </div>
    );
}
