import { Skeleton } from "@/components/ui/skeleton";

export default function HomeSkeleton() {
  return (
    <div className="space-y-8">
      {/* Top search bar (mobile) */}
      <div className="container mx-auto px-4 pt-4 md:hidden">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>

      {/* Hero + promo */}
      <div className="container mx-auto px-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4">
          <Skeleton className="h-60 md:h-80 w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>

        {/* Sliding cards / quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Image grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 md:h-40 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="container mx-auto px-4 space-y-4">
        <Skeleton className="h-8 w-40 rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-44 md:h-56 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials / reviews skeletons are already handled in their own components */}
    </div>
  );
}

