'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistShareProps {
    wishlistIds: string[];
}

export default function WishlistShare({ wishlistIds }: WishlistShareProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    // Encode wishlist IDs to base64 for URL sharing
    const encodeWishlist = (ids: string[]): string => {
        try {
            const json = JSON.stringify(ids);
            return btoa(json);
        } catch {
            return '';
        }
    };

    // Generate shareable URL
    const shareableUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/wishlist/shared?data=${encodeWishlist(wishlistIds)}`
        : '';

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareableUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const shareToWhatsApp = () => {
        const text = `Check out my wishlist! ${shareableUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`, '_blank');
    };

    if (wishlistIds.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Wishlist
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Your Wishlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Input
                            value={shareableUrl}
                            readOnly
                            className="flex-1 text-sm"
                        />
                        <Button size="icon" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={shareToWhatsApp}
                        >
                            <MessageCircle className="h-5 w-5 mr-2 text-green-500" />
                            WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={shareToFacebook}
                        >
                            <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                            Facebook
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Anyone with this link can view your wishlist
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
