'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { API_ENDPOINTS } from '@/config/api';
import { getReviewsDirect } from '@/lib/supabase';
import { createReviewAction } from '@/app/actions/reviews';

interface Review {
  id: string;
  product_id: string;
  customer_id?: string;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductReviewsNewProps {
  productId: string;
  productName: string;
}

export default function ProductReviewsNew({ productId, productName }: ProductReviewsNewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getReviewsDirect(productId);
      const approvedReviews = (data || []).filter((r: Review) => r.is_approved);
      setReviews(approvedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.comment.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in your name and review.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await createReviewAction({
        product_id: productId,
        customer_name: formData.customerName,
        rating: formData.rating,
        comment: formData.comment
      });

      if (!result.success) throw new Error(result.error);

      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        rating: 5,
        title: '',
        comment: '',
      });

      setIsDialogOpen(false);

      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback. Your review will be visible after approval.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="mt-8 pt-8 border-t">
      {/* Header with Add Review Button */}
      <div className="flex flex-col items-center justify-center gap-4 mb-6 text-center">
        <div>
          <h2 className="text-xl font-bold font-headline">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {renderStars(Math.round(Number(averageRating)))}
              </div>
              <span className="font-semibold">{averageRating}</span>
              <span className="text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with {productName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitReview} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email (optional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rating *</Label>
                <div className="flex items-center gap-2">
                  {renderStars(formData.rating, true, (rating) => setFormData(prev => ({ ...prev, rating })))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {formData.rating === 5 ? 'Excellent' : formData.rating === 4 ? 'Good' : formData.rating === 3 ? 'Average' : formData.rating === 2 ? 'Poor' : 'Very Poor'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of your experience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Your Review *</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        null
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review) => (
            <Card key={review.id} className="overflow-hidden h-full">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold line-clamp-1">{review.customer_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground flex-grow line-clamp-4">{review.comment}</p>

                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
