
"use client";

import { useEffect, useState } from 'react';
import { getReviewsAdmin, updateReviewStatus, deleteReview } from '@/lib/actions';
import type { Review } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, MessageSquare, Star, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function ReviewActions({ review, onAction }: { review: Review, onAction: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (isVerified: boolean) => {
    setLoading(true);
    const result = await updateReviewStatus(review.id, isVerified);
    if (result.success) {
      toast({ title: 'Success', description: `Review marked as ${isVerified ? 'verified' : 'unverified'}.` });
      onAction();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this review?')) {
      setLoading(true);
      const result = await deleteReview(review.id);
      if (result.success) {
        toast({ title: 'Success', description: 'Review deleted.' });
        onAction();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <div className="flex items-center gap-2 mr-2">
        <span className={cn("text-xs", review.is_verified ? "text-green-500" : "text-muted-foreground")}>
          {review.is_verified ? "Verified" : "Pending"}
        </span>
        <Switch
          checked={review.is_verified}
          onCheckedChange={(checked) => handleUpdate(checked)}
          disabled={loading}
          className="data-[state=checked]:bg-green-500"
        />
      </div>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const fetchedReviews = await getReviewsAdmin();
      setReviews(fetchedReviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-[#137fec]" />
            Reviews
          </h1>
          <p className="text-muted-foreground text-sm">Manage customer feedback and ratings</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-lg flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium">Total Reviews:</span>
          <span className="text-lg font-bold text-[#137fec]">{reviews.length}</span>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-white/5 bg-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground w-24">Product</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground w-40">Customer</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground w-32">Rating</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Comment</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground text-right w-48">Actions</TableHead>
              </TableRow>
            </TableHeader >
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-white/5">
                    <TableCell>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="h-3 w-3 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No reviews found.
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {review.product_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{review.author_name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < review.rating ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted"
                            )}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm line-clamp-2 text-muted-foreground italic">"{review.comment}"</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <ReviewActions review={review} onAction={fetchReviews} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table >
        </div >
      </div >
    </div >
  );
}
