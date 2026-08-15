import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/** Neutral pulsing block used to compose loading skeletons. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-mist", className)} />;
}

/** Placeholder matching the CompanyCard layout while the list loads. */
export function CompanyCardSkeleton() {
  return (
    <Card className="flex h-full flex-col p-5">
      <SkeletonBlock className="h-5 w-3/5" />
      <SkeletonBlock className="mt-2 h-3 w-2/5" />
      <SkeletonBlock className="mt-4 h-3 w-full" />
      <SkeletonBlock className="mt-1.5 h-3 w-4/5" />
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
        <SkeletonBlock className="h-8" />
        <SkeletonBlock className="h-8" />
        <SkeletonBlock className="h-8" />
        <SkeletonBlock className="h-8" />
      </div>
    </Card>
  );
}

/** Grid of card placeholders sized like a full marketplace page. */
export function CompanyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CompanyCardSkeleton key={i} />
      ))}
    </div>
  );
}
