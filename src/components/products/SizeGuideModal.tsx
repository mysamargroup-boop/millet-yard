'use client';

import { useState } from 'react';
import { Ruler, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';

interface SizeGuideModalProps {
    imageUrl: string;
    categoryName?: string;
}

export default function SizeGuideModal({ imageUrl, categoryName }: SizeGuideModalProps) {
    const [open, setOpen] = useState(false);

    if (!imageUrl) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                    <Ruler className="h-4 w-4" />
                    📐 Size Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-primary" />
                        Size / Dimension Guide
                        {categoryName && <span className="text-muted-foreground font-normal text-sm">— {categoryName}</span>}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    <img
                        src={imageUrl}
                        alt={`Size guide for ${categoryName || 'this category'}`}
                        className="w-full h-auto rounded-lg border"
                        loading="lazy"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
