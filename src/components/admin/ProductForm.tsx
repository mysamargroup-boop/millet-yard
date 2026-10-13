
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product, Category } from "@/lib/types";
import { getCategories, getAdminCategories, getTags } from "@/lib/data-async";
import { getAdminCategoriesAction, quickCreateCategory } from "@/lib/actions";
import { improveTextAction } from "@/lib/ai-actions";
import { ProductVariantsManager } from "./ProductVariantsManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2, Sparkles, Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Pilcrow, Plus, X, ImagePlus, Tag, LayoutList, Palette, Scale, Ruler } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import { Switch } from "../ui/switch";
import { CldUploadWidget } from "next-cloudinary";

type ProductFormProps = {
  action: (formData: FormData) => void;
  product?: Product | null;
  buttonText: string;
  initialState: any;
  defaultIdPrefix?: string;
};

const SeoScoreIndicator = ({ score, text }: { score: number; text: string; }) => {
  const uniqueId = `score-${text.replace(/\s+/g, '-').toLowerCase()}`;

  const getGradientColor = (score: number) => {
    if (score > 80) return 'from-green-500 to-green-400';
    if (score > 50) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 w-full">
      <div className="relative h-10 w-10 flex-shrink-0">
        <svg className="transform -rotate-90" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" strokeWidth="3" stroke="hsl(var(--border))" fill="transparent" />
          <circle
            cx="20" cy="20" r="18"
            stroke={`url(#gradient-${score > 80 ? 'green' : score > 50 ? 'yellow' : 'red'}-${uniqueId})`}
            fill="transparent"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <defs>
            <linearGradient id={`gradient-green-${uniqueId}`}>
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id={`gradient-yellow-${uniqueId}`}>
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
            <linearGradient id={`gradient-red-${uniqueId}`}>
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}</span>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{text}</p>
      </div>
    </div>
  );
};


function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full md:w-auto bg-[#000000] text-white hover:bg-[#111111] ring-0 focus:ring-0 rounded-lg px-10 h-11 text-base font-bold shadow-lg transition-all active:scale-95"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Creating..." : text}
    </Button>
  );
}

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromState = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement !== editor && value !== editor.innerHTML) {
      isUpdatingFromState.current = true;
      editor.innerHTML = value || '';
      isUpdatingFromState.current = false;
    }
  }, [value]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  }, [onChange]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleFormatBlock = (tag: string) => {
    handleCommand('formatBlock', `<${tag}>`);
  };

  return (
    <div className="rounded-md border border-input w-full">
      <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-muted/50">
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('bold'); }} title="Bold"><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('italic'); }} title="Italic"><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('underline'); }} title="Underline"><Underline className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleLink(); }} title="Link"><Link2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('p'); }} title="Paragraph"><Pilcrow className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('h1'); }} title="Heading 1"><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('h2'); }} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('h3'); }} title="Heading 3"><Heading3 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertUnorderedList'); }} title="Bullet List"><List className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertOrderedList'); }} title="Numbered List"><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('justifyLeft'); }} title="Align Left"><AlignLeft className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('justifyCenter'); }} title="Align Center"><AlignCenter className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onMouseDown={(e) => { e.preventDefault(); handleCommand('justifyRight'); }} title="Align Right"><AlignRight className="h-4 w-4" /></Button>
      </div>
      <div
        id="description-editor"
        ref={editorRef}
        contentEditable
        className="prose dark:prose-invert max-w-full min-h-[150px] p-3 focus:outline-none w-full [&_p]:my-0 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
        onInput={handleInput}
        onPaste={handlePaste}
      />
      <Textarea name="description" value={value} className="hidden" readOnly />
    </div>
  );
};


export function ProductForm({ action, product, buttonText, initialState, defaultIdPrefix }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [description, setDescription] = useState(product?.description || '');
  const [name, setName] = useState(product?.name || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [productId, setProductId] = useState(product?.id || defaultIdPrefix || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(product?.imageAlt || '');

  // Update productId when defaultIdPrefix loads, if pseudo-empty
  useEffect(() => {
    if (!product && defaultIdPrefix && !productId) {
      setProductId(`${defaultIdPrefix}-`);
    }
  }, [defaultIdPrefix, product, productId]);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [tagsInput, setTagsInput] = useState(product?.tags?.join(", ") || "");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTagSuggestions, setFilteredTagSuggestions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<{ name: string; value: string }[]>(
    (product?.colorOptions as { name: string; value: string }[]) || []
  );
  const [options, setOptions] = useState(product?.options || []);
  const [variants, setVariants] = useState(product?.variants || []);

  const [isImprovingTitle, setIsImprovingTitle] = useState(false);
  const [isImprovingDesc, setIsImprovingDesc] = useState(false);

  // Quick Category Add States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsQuickAdding(true);
    try {
      const result = await quickCreateCategory(newCategoryName);
      if (result.success && result.categoryId) {
        const newCat: Category = {
          id: result.categoryId,
          name: result.name!,
          imageUrl: 'https://placehold.co/400x400?text=' + encodeURIComponent(result.name!),
          imageHint: result.name!,
        };
        setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
        setIsQuickAddOpen(false);
        setNewCategoryName("");
        toast({ title: "Success", description: "Category created successfully!" });
      } else {
        toast({ title: "Error", description: result.error || "Failed to create category", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleImprove = async (type: 'title' | 'description') => {
    const isTitle = type === 'title';
    const currentText = isTitle ? name : description;

    if (!currentText || currentText.trim().length === 0) {
      toast({
        title: "No text to improve",
        description: `Please enter a ${type} first.`,
        variant: "destructive"
      });
      return;
    }

    if (isTitle) setIsImprovingTitle(true);
    else setIsImprovingDesc(true);

    try {
      const improved = await improveTextAction(currentText, type);
      if (isTitle) setName(improved);
      else setDescription(improved);

      toast({
        title: "Improved!",
        description: `Product ${type} has been enhanced by AI.`,
      });
    } catch (error: any) {
      console.error("Improvement error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to improve text. Check your API key.",
        variant: "destructive"
      });
    } finally {
      if (isTitle) setIsImprovingTitle(false);
      else setIsImprovingDesc(false);
    }
  };

  const getAdvice = useCallback((score: number, type: 'title' | 'desc' | 'meta' | 'id' | 'url' | 'alt') => {
    let advice = [];
    if (type === 'title') {
      if (score < 50) advice.push("Too short. Aim for 50-70 characters.");
      else if (score < 100) advice.push("Length is okay, but could be longer.");
      else advice.push("Good length.");
    } else if (type === 'desc') {
      if (score < 50) advice.push("Too short. Aim for 500+ characters.");
      else advice.push("Good length.");
    } else if (type === 'meta') {
      if (score < 50) advice.push("Too short. Aim for 140-160 characters.");
      else if (score < 100) advice.push("Length is good.");
      else advice.push("Excellent length.");
    } else if (type === 'id') {
      if (!/^[a-zA-Z0-9-]+$/.test(productId)) advice.push("Use only letters, numbers, hyphens.");
      else advice.push("Good ID format.");
    } else if (type === 'url') {
      if (!imageUrl) advice.push("URL is required.");
      else if (!/^(https?:\/\/)/.test(imageUrl)) advice.push("Must be a valid http/https link.");
      else advice.push("URL format is valid.");
    } else if (type === 'alt') {
      if (!imageAlt) advice.push("Alt text is crucial for accessibility & SEO.");
      else if (imageAlt.length < 10) advice.push("Provide a more descriptive alt text.");
      else advice.push("Good, descriptive alt text.");
    }
    return advice.map((item, index) => <p key={index}>{item}</p>);
  }, [productId, imageUrl, imageAlt]);

  const [nameScore] = useMemo(() => {
    const len = name.length;
    let score = 0;
    if (len > 0 && len < 30) score = Math.round((len / 30) * 50);
    else if (len > 80) score = Math.max(0, 100 - (len - 80));
    else if (len >= 30 && len <= 80) score = 100 - Math.abs(len - 60) * 2;
    return [score];
  }, [name]);

  const [descriptionScore] = useMemo(() => {
    const textContent = description.replace(/<[^>]*>/g, '');
    const len = textContent.length;
    let score = 0;
    if (len > 0 && len < 300) score = Math.round((len / 300) * 50);
    else if (len > 1500) score = Math.max(20, 100 - ((len - 1500) / 20));
    else if (len >= 300) score = 100;
    return [score];
  }, [description]);

  const addColorOption = () => {
    setColorOptions([...colorOptions, { name: '', value: '#000000' }]);
  };

  const removeColorOption = (index: number) => {
    setColorOptions(colorOptions.filter((_, i) => i !== index));
  };

  const updateColorOption = (index: number, field: 'name' | 'value', value: string) => {
    const newOptions = [...colorOptions];
    newOptions[index][field] = value;
    setColorOptions(newOptions);
  };

  const [shortDescriptionScore] = useMemo(() => {
    const len = shortDescription.length;
    let score = 0;
    if (len > 0 && len < 120) score = Math.round((len / 120) * 50);
    else if (len > 170) score = Math.max(20, 100 - (len - 170));
    else if (len >= 120) score = 100;
    return [score];
  }, [shortDescription]);

  const [idScore] = useMemo(() => {
    const len = productId.length;
    let score = 0;
    if (len === 0) score = 0;
    else if (!/^[a-zA-Z0-9-]+$/.test(productId)) score = 10;
    else if (len > 50) score = Math.max(20, 100 - (len - 50));
    else score = 100;
    return [score];
  }, [productId]);

  const [urlScore] = useMemo(() => {
    let score = 0;
    if (!imageUrl) score = 0;
    else if (!/^(https?:\/\/)/.test(imageUrl)) score = 10;
    else score = 100;
    return [score];
  }, [imageUrl]);

  const [altScore] = useMemo(() => {
    let score = 0;
    if (!imageAlt) score = 0;
    else if (imageAlt.length < 10) score = 50;
    else if (imageAlt.length > 125) score = Math.max(20, 100 - (imageAlt.length - 125));
    else score = 100;
    return [score];
  }, [imageAlt]);


  const state = initialState;

  const isCloudinaryEnabled = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedCategories, fetchedTags] = await Promise.all([
          getAdminCategoriesAction(),
          getTags()
        ]);
        setCategories(fetchedCategories || []);
        setAllTags(fetchedTags || []);
      } catch (err) {
        console.error("[ProductForm] Failed to fetch form data:", err);
      }
    }
    fetchData();
  }, []);

  const handleTagsChange = (val: string) => {
    setTagsInput(val);
    const parts = val.split(",").map(s => s.trim()).filter(Boolean);
    const current = parts[parts.length - 1] || "";
    if (current.length === 0) {
      setFilteredTagSuggestions([]);
      return;
    }
    const existing = new Set(parts.map(p => p.toLowerCase()));
    const suggestions = allTags.filter(t => t.toLowerCase().includes(current.toLowerCase()) && !existing.has(t.toLowerCase()));
    setFilteredTagSuggestions(suggestions.slice(0, 8));
  };

  const applyTagSuggestion = (tag: string) => {
    const parts = tagsInput.split(",").map(s => s.trim()).filter(Boolean);
    const existing = new Set(parts.map(p => p.toLowerCase()));
    if (!existing.has(tag.toLowerCase())) {
      parts[parts.length - 1] = tag;
      const next = Array.from(new Set(parts.map(p => p.trim()))).join(", ");
      setTagsInput(next);
      setShowTagSuggestions(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!name) {
      toast({ title: "Product name required", description: "Please enter a product name first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({ productName: name });
      if (result.description) {
        setDescription(`<p>${result.description.replace(/\\n/g, '</p><p>')}</p>`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate description.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {state?.errors?._form && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4 text-destructive text-sm font-medium">
          {state.errors._form.join(", ")}
        </div>
      )}
      <form action={action}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {product ? "Edit Product" : "Create New Product"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Essential Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column: Core Details (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Name & Desc */}
                <Card className="border-none shadow-none p-0">
                  <CardContent className="p-0 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                          Product Name <span className="text-destructive">*</span>
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700 border-0 shadow-sm transition-all duration-300"
                          onClick={() => handleImprove('title')}
                          disabled={isImprovingTitle || !name}
                        >
                          {isImprovingTitle ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3 fill-white/20" />}
                          {isImprovingTitle ? 'Improving...' : 'AI Improve'}
                        </Button>
                      </div>
                      <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} required className="h-12 text-lg" placeholder="e.g. Panda Keychain" />
                      {state?.errors?.name && <p className="text-xs font-medium text-destructive mt-1">{state.errors.name[0]}</p>}
                      <div className="flex items-center gap-2">
                        <SeoScoreIndicator score={nameScore} text="Title Strength" />
                        <span className="text-xs text-muted-foreground flex-1">{getAdvice(nameScore, 'title')}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700 border-0 shadow-sm transition-all duration-300"
                            onClick={() => handleImprove('description')}
                            disabled={isImprovingDesc || !description}
                          >
                            {isImprovingDesc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 fill-white/20" />}
                            {isImprovingDesc ? 'Improving...' : 'AI Improve'}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="text-primary hover:bg-primary/10" onClick={handleGenerateDescription} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Auto-Generate
                          </Button>
                        </div>
                      </div>
                      <RichTextEditor value={description} onChange={setDescription} />
                      {state?.errors?.description && <p className="text-xs font-medium text-destructive mt-1">{state.errors.description[0]}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Images Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ImagePlus className="w-5 h-5" /> Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-semibold">Main Product Image <span className="text-destructive">*</span></Label>
                      <div className="flex flex-col gap-4">
                        <Input id="imageUrl" name="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required placeholder="https://..." className="font-mono text-sm" />
                        {state?.errors?.imageUrl && <p className="text-xs font-medium text-destructive">{state.errors.imageUrl[0]}</p>}

                        {isCloudinaryEnabled && (
                          <CldUploadWidget
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                            options={{
                              sources: ['local', 'url', 'unsplash'],
                              multiple: false,
                              maxFiles: 1,
                              clientAllowedFormats: ["image"],
                              maxImageFileSize: 5000000
                            }}
                            onSuccess={(result: any) => {
                              const url = result?.info?.secure_url || '';
                              if (url) setImageUrl(url);
                            }}
                          >
                            {({ open }) => (
                              <div
                                onClick={() => open()}
                                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-all hover:border-primary/50 group"
                              >
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-foreground">Click to Upload</p>
                                  <p className="text-sm text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
                                </div>
                              </div>
                            )}
                          </CldUploadWidget>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <SeoScoreIndicator score={urlScore} text="URL" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Tag className="w-5 h-5" /> Pricing & Inventory</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="regularPrice">Regular Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                        <Input
                          id="regularPrice"
                          name="regularPrice"
                          type="number"
                          step="0.01"
                          className="pl-7"
                          defaultValue={product?.regularPrice ?? product?.price}
                          required
                          onChange={(e) => {
                            const reg = parseFloat(e.target.value);
                            const sale = parseFloat((document.getElementById('salePrice') as HTMLInputElement).value);
                            if (sale && reg && sale >= reg) {
                              alert("Sale Price must be less than Regular Price");
                              (document.getElementById('salePrice') as HTMLInputElement).setCustomValidity("Sale price must be lower.");
                            } else {
                              (document.getElementById('salePrice') as HTMLInputElement)?.setCustomValidity("");
                            }
                          }}
                        />
                      </div>
                      {state?.errors?.regularPrice && <p className="text-xs font-medium text-destructive mt-1">{state.errors.regularPrice[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Sale Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                        <Input
                          id="salePrice"
                          name="salePrice"
                          type="number"
                          step="0.01"
                          className="pl-7"
                          defaultValue={product?.salePrice ?? ''}
                          onChange={(e) => {
                            const sale = parseFloat(e.target.value);
                            const reg = parseFloat((document.getElementById('regularPrice') as HTMLInputElement).value);
                            if (sale && reg && sale >= reg) {
                              e.target.setCustomValidity("Sale price must be lower than Regular Price.");
                            } else {
                              e.target.setCustomValidity("");
                            }
                          }}
                        />
                      </div>
                      {state?.errors?.salePrice && <p className="text-xs font-medium text-destructive mt-1">{state.errors.salePrice[0]}</p>}
                      <p className="text-[10px] text-muted-foreground">Must be lower than Regular</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Cost Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                        <Input
                          id="costPrice"
                          name="costPrice"
                          type="number"
                          step="0.01"
                          className="pl-7"
                          defaultValue={product?.costPrice ?? ''}
                        />
                      </div>
                      {state?.errors?.costPrice && <p className="text-xs font-medium text-destructive mt-1">{state.errors.costPrice[0]}</p>}
                      <p className="text-[10px] text-muted-foreground">For P&L Dashboard only</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inventory">Stocks</Label>
                      <Input id="inventory" name="inventory" type="number" defaultValue={product?.inventory} required />
                      {state?.errors?.inventory && <p className="text-xs font-medium text-destructive mt-1">{state.errors.inventory[0]}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Organization (1/3 width) */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Organization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="idSuffix">SKU / ID <span className="text-destructive">*</span></Label>
                      <div className="flex items-center">
                        {defaultIdPrefix && (
                          <div className="bg-muted border border-r-0 rounded-l-md px-3 py-2 text-sm font-mono text-muted-foreground select-none">
                            {defaultIdPrefix}-
                          </div>
                        )}
                        <Input
                          id="idSuffix"
                          name="idSuffix"
                          value={productId.replace(`${defaultIdPrefix || ''}-`, '')}
                          onChange={e => setProductId(`${defaultIdPrefix ? defaultIdPrefix + '-' : ''}${e.target.value}`)}
                          disabled={!!product}
                          required
                          className={`font-mono text-sm ${defaultIdPrefix ? 'rounded-l-none' : ''}`}
                          placeholder="101"
                        />
                        <input type="hidden" name="id" value={productId} />
                      </div>
                      {state?.errors?.id && <p className="text-xs font-medium text-destructive">{state.errors.id[0]}</p>}
                      <p className="text-xs text-muted-foreground">Final SKU: {productId}</p>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 px-1">
                              <Plus className="w-3 h-3" /> Quick Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Quick Add Category</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="quick-name">Category Name</Label>
                                <Input
                                  id="quick-name"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  placeholder="e.g. New Collection"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickAddCategory();
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" onClick={handleQuickAddCategory} disabled={isQuickAdding || !newCategoryName.trim()}>
                                {isQuickAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Create Category
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select name="category" defaultValue={product?.category} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {categories.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">No categories</div>
                          ) : (
                            categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {state?.errors?.category && <p className="text-xs font-medium text-destructive mt-1">{state.errors.category[0]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center justify-between border rounded-lg p-3">
                        <span className="text-sm font-medium">Active</span>
                        <Switch defaultChecked={true} name="status" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Badge</CardTitle>
                    {/* 
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    HOW TO ADD / EDIT BADGES:
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    1. To ADD a new badge, copy any <SelectItem> below and change value="YourBadgeName"
                       Example: <SelectItem value="Gift">Gift</SelectItem>
                    2. To REMOVE a badge, delete the corresponding <SelectItem> line.
                    3. The badge value is saved to the database "badge" column.
                    4. "Featured Products" section on homepage shows ALL products with ANY badge set.
                    5. "Bestsellers" section ONLY shows products with badge = "Best Seller".
                    6. Badge text appears as a label on the product card on the website.
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  */}
                  </CardHeader>
                  <CardContent>
                    <Select name="badge" defaultValue={product?.badge}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Best Seller">Best Seller</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Limited">Limited</SelectItem>
                        <SelectItem value="Trending">Trending</SelectItem>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Hot">Hot</SelectItem>
                        <SelectItem value="Exclusive">Exclusive</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Featured">Featured</SelectItem>
                        <SelectItem value="Popular">Popular</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Products with any badge appear in &quot;Featured Products&quot; section. &quot;Best Seller&quot; badge also shows in &quot;Bestsellers&quot; section.
                    </p>
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Advanced / Optional Sections using Accordion for clean look */}
            <div className="mt-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <LayoutList className="w-5 h-5 text-muted-foreground" />
                      Additional Details & SEO
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="subCategory">Sub Category</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 px-1"
                            onClick={() => setIsQuickAddOpen(true)}
                          >
                            <Plus className="w-3 h-3" /> Quick Add
                          </Button>
                        </div>
                        <Select name="subCategory" defaultValue={product?.subCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sub-category (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          name="tags"
                          placeholder="e.g. Panda, Keychain (comma separated)"
                          value={tagsInput}
                          onChange={e => handleTagsChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">SEO Meta Description</Label>
                      <Textarea
                        id="shortDescription"
                        name="shortDescription"
                        value={shortDescription}
                        onChange={e => setShortDescription(e.target.value)}
                        className="h-20"
                        placeholder="Brief summary for search engines..."
                      />
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">{shortDescription.length} chars</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="imageAlt">Main Image Alt Text</Label>
                        <Input id="imageAlt" name="imageAlt" value={imageAlt} onChange={e => setImageAlt(e.target.value)} placeholder="Descriptive text for accessibility" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">Video URL</Label>
                        <Input id="videoUrl" name="videoUrl" defaultValue={product?.videoUrl} placeholder="YouTube/Vimeo link" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Gallery Images (URLs)</Label>
                      <Textarea name="galleryImages" placeholder="https://..., https://..." className="font-mono text-sm" defaultValue={product?.galleryImages?.join(", ")} />
                    </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                      <Switch id="allowImageUpload" name="allowImageUpload" defaultChecked={product?.allowImageUpload} />
                      <div className="flex-1">
                        <Label htmlFor="allowImageUpload" className="text-base">Allow Customer Uploads</Label>
                        <p className="text-sm text-muted-foreground">Customers can upload their own design/photo for this product.</p>
                      </div>
                    </div>

                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping-dimensions" className="border rounded-lg px-4 bg-card mt-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Scale className="w-5 h-5 text-muted-foreground" />
                      Weight & Dimensions
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-muted-foreground" />
                          <Label className="font-semibold">Weight Settings</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="weight">Weight Value</Label>
                            <Input
                              id="weight"
                              name="weight"
                              type="number"
                              step="0.01"
                              defaultValue={product?.weight || ''}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="weightUnit">Unit</Label>
                            <Select name="weightUnit" defaultValue={product?.weightUnit || "kg"}>
                              <SelectTrigger id="weightUnit">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                <SelectItem value="g">Grams (g)</SelectItem>
                                <SelectItem value="lb">Pounds (lb)</SelectItem>
                                <SelectItem value="oz">Ounces (oz)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-muted-foreground" />
                          <Label className="font-semibold">Dimension Settings</Label>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor="length" className="text-[10px] uppercase">Length</Label>
                              <Input id="length" name="length" type="number" step="0.1" defaultValue={product?.dimensions?.length || ''} placeholder="L" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="width" className="text-[10px] uppercase">Width</Label>
                              <Input id="width" name="width" type="number" step="0.1" defaultValue={product?.dimensions?.width || ''} placeholder="W" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="height" className="text-[10px] uppercase">Height</Label>
                              <Input id="height" name="height" type="number" step="0.1" defaultValue={product?.dimensions?.height || ''} placeholder="H" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dimensionUnit">Unit</Label>
                            <Select name="dimensionUnit" defaultValue={product?.dimensionUnit || "cm"}>
                              <SelectTrigger id="dimensionUnit">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                <SelectItem value="inch">Inches (in)</SelectItem>
                                <SelectItem value="m">Meters (m)</SelectItem>
                                <SelectItem value="ft">Feet (ft)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card mt-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Palette className="w-5 h-5 text-muted-foreground" />
                      Variants & Attributes
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6 space-y-6">

                    {/* New Variants Manager */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Options & Variants</Label>
                      <ProductVariantsManager
                        initialOptions={options}
                        initialVariants={variants}
                        basePrice={Number(product?.regularPrice || product?.price || 0)}
                        baseSalePrice={Number(product?.salePrice || 0)}
                        baseStock={Number(product?.inventory || 0)}
                        onChange={(opts, vars) => {
                          setOptions(opts);
                          setVariants(vars);
                        }}
                      />
                      <input type="hidden" name="options" value={JSON.stringify(options)} />
                      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
                    </div>

                    <div className="border-t my-4" />

                    {/* Legacy Colors (Hidden or Optional) - Kept for backward compat but minimized */}
                    <div className="space-y-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Legacy Color Options (Deprecated)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addColorOption} className="h-6 text-xs">
                          <Plus className="h-3 w-3 mr-1" /> Add Legacy Color
                        </Button>
                      </div>
                      {/* ... legacy color inputs ... */}
                      <div className="space-y-2 hidden">
                        {colorOptions.map((color, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 border rounded-md bg-background">
                            <input type="hidden" name={`legacy_color_${index}`} value={color.value} />
                          </div>
                        ))}
                      </div>
                      <input type="hidden" name="colorOptions" value={JSON.stringify(colorOptions)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                      <div className="space-y-2">
                        <Label>Material</Label>
                        <Input name="material" defaultValue={product?.material} placeholder="e.g. Cotton" />
                      </div>
                      <div className="space-y-2">
                        <Label>Image Hint</Label>
                        <Input name="imageHint" defaultValue={product?.imageHint} placeholder="e.g. Front view" />
                      </div>
                    </div>

                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>


            <div className="sticky bottom-4 z-50 mt-8 flex justify-end">
              <div className="bg-background/80 backdrop-blur-md border shadow-lg rounded-full px-6 py-2">
                <SubmitButton text={buttonText} />
              </div>
            </div>

            {/* Hidden Helpers */}
            {/* ... other hidden states if needed */}
          </CardContent>
        </Card>
      </form>
    </div >
  );
}
