"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createSiteImage } from "@/lib/actions"; // We will add this export
import { useToast } from "@/hooks/use-toast";

const sections = [
    { value: "hero", label: "Hero Slider (Desktop/Mobile)" },
    { value: "spotlight", label: "Spotlight Slider" },
    { value: "instagram", label: "Instagram Feed" },
    { value: "dual-banner", label: "Landscape Dual Banners" },
    { value: "promo-banner", label: "Promo Banners" },
    { value: "grid", label: "Grid Feature" },
    { value: "other", label: "Other / Custom ID" },
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-[#137fec] hover:bg-[#0d6edb] text-white">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Creating..." : "Add Image"}
        </Button>
    );
}

export function AddSiteImageDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [section, setSection] = useState("hero");

    async function clientAction(formData: FormData) {
        const result = await createSiteImage(formData);
        if (result?.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: `Image added successfully! ID: ${result?.id}`,
            });
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#137fec] hover:bg-[#0d6edb] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add New Image
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle>Add New Site Image</DialogTitle>
                    <DialogDescription>
                        Select a section and add your image details. The ID will be generated automatically.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Select name="section" defaultValue={section} onValueChange={setSection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {section === 'other' && (
                        <div className="space-y-2">
                            <Label htmlFor="customId">Custom ID (Optional)</Label>
                            <Input id="customId" name="customId" placeholder="e.g. my-special-banner" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL *</Label>
                        <Input id="imageUrl" name="imageUrl" placeholder="https://..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                        <Input id="linkUrl" name="linkUrl" placeholder="/collections/..." />
                        {section === 'instagram' && <p className="text-[10px] text-muted-foreground">For Instagram, put the link to the post here.</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Title (Optional)</Label>
                            <Input id="name" name="name" placeholder="Title text" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="buttonText">Button Text (Optional)</Label>
                            <Input id="buttonText" name="buttonText" placeholder="Shop Now" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input id="description" name="description" placeholder="Subtitle or description" />
                    </div>

                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
