import { cn } from "@/lib/cn";
import { ROW_GRID } from "./company-card";

/** Neutral pulsing block used to compose loading skeletons. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-mist", className)} />;
}

/** Placeholder matching one CompanyListRow while the list loads. */
export function CompanyRowSkeleton() {
  return (
    <li className={cn("px-4 py-4 sm:px-5", ROW_GRID)}>
      <div className="flex min-w-0 items-center gap-3.5">
        <SkeletonBlock className="size-10 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="mt-1.5 h-3.5 w-4/5 max-w-96" />
          <SkeletonBlock className="mt-1.5 h-3 w-56 lg:hidden" />
        </div>
      </div>
      <SkeletonBlock className="hidden h-3.5 w-32 lg:block" />
      <SkeletonBlock className="ml-auto hidden h-4 w-14 lg:block" />
      <SkeletonBlock className="ml-auto hidden h-4 w-11 lg:block" />
      <SkeletonBlock className="ml-auto hidden h-4 w-20 lg:block" />
      <SkeletonBlock className="hidden h-3.5 w-24 lg:block" />
      <div className="mt-2 flex gap-4 pl-[3.375rem] lg:hidden">
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
      <div aria-hidden="true" className="hidden border-b border-line bg-canvas px-5 py-2.5 lg:block">
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
