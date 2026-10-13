

"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import { useState } from "react";

type CategoryFormProps = {
  action: (formData: FormData) => void;
  category?: Category | null;
  buttonText: string;
  initialState: any;
};


function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto bg-black text-white hover:bg-gray-800 ring-0 focus:ring-0 rounded-md px-8">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Saving..." : text}
    </Button>
  );
}

export function CategoryForm({ action, category, buttonText, initialState }: CategoryFormProps) {
  const state = initialState;
  const [name, setName] = useState(category?.name || '');

  const generatedId = name ? slugify(name) : '';

  return (
    <form action={action}>
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            {category ? "Edit Category" : "Create New Category"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          <Card className="border shadow-none p-0">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold">Category Name <span className="text-destructive">*</span></Label>
                  <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" placeholder="e.g. Office Supplies" />
                  {state?.errors?.name && <p className="text-destructive text-sm">{state.errors.name[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id" className="text-base font-semibold">Category ID (Slug)</Label>
                  <Input id="id" name="id" value={category?.id || generatedId} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Generated automatically. Cannot be changed.</p>
                  {state?.errors?.id && <p className="text-destructive text-sm">{state.errors.id[0]}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-base font-semibold">Image URL <span className="text-destructive">*</span></Label>
                <Input id="imageUrl" name="imageUrl" defaultValue={category?.imageUrl} required placeholder="https://..." />
                {state?.errors?.imageUrl && <p className="text-destructive text-sm">{state.errors.imageUrl[0]}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="imageHint" className="text-base font-semibold">Image Hint</Label>
                  <Input id="imageHint" name="imageHint" defaultValue={category?.imageHint} required placeholder="e.g. desk accessories" />
                  <p className="text-xs text-muted-foreground">Short description for AI image generation.</p>
                  {state?.errors?.imageHint && <p className="text-destructive text-sm">{state.errors.imageHint[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkUrl" className="text-base font-semibold">Link URL</Label>
                  <Input id="linkUrl" name="linkUrl" defaultValue={category?.linkUrl} placeholder="(Optional) External link" />
                  {state?.errors?.linkUrl && <p className="text-destructive text-sm">{state.errors.linkUrl[0]}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sizeGuideImageUrl" className="text-base font-semibold">Size Guide Image URL</Label>
                <Input id="sizeGuideImageUrl" name="sizeGuideImageUrl" defaultValue={category?.size_guide_image_url || ''} placeholder="(Optional) URL to size/dimension chart image" />
                <p className="text-xs text-muted-foreground">If set, a &quot;📐 Size Guide&quot; button will appear on product pages in this category.</p>
                {state?.errors?.sizeGuideImageUrl && <p className="text-destructive text-sm">{state.errors.sizeGuideImageUrl[0]}</p>}
              </div>

              <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                <input
                  type="checkbox"
                  id="is_trending"
                  name="is_trending"
                  defaultChecked={category?.is_trending}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_trending" className="font-normal text-base cursor-pointer">Show in Trending Collections (Homepage)</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <SubmitButton text={buttonText} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
