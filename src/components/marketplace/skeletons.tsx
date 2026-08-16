import { cn } from "@/lib/cn";

/** Neutral pulsing block used to compose loading skeletons. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-mist", className)} />;
}

/** Placeholder matching one CompanyListRow while the list loads. */
export function CompanyRowSkeleton() {
  return (
    <li className="px-4 py-3.5 sm:px-5 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_7rem_12rem] md:items-center md:gap-x-6 md:py-3">
      <div className="min-w-0">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-1.5 h-3.5 w-4/5 max-w-96" />
        <SkeletonBlock className="mt-1.5 h-3 w-56" />
      </div>
      <SkeletonBlock className="ml-auto hidden h-4 w-16 md:block" />
      <SkeletonBlock className="ml-auto hidden h-4 w-12 md:block" />
      <SkeletonBlock className="hidden h-3.5 w-28 md:block" />
      <div className="mt-2 flex gap-4 md:hidden">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
    </li>
  );
}

/** Result-list placeholder sized like a full marketplace page. */
export function CompanyListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper shadow-card">
      <div
        aria-hidden="true"
        className="hidden border-b border-line-strong bg-mist/60 px-5 py-2.5 md:block"
      >
        <SkeletonBlock className="h-3.5 w-2/5 max-w-64" />
      </div>
      <ul className="divide-y divide-line">
        {Array.from({ length: count }, (_, i) => (
          <CompanyRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}
