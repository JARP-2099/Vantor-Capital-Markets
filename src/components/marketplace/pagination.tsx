import Link from "next/link";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /** Builds an href for a given page, preserving the current filter params. */
  hrefFor: (page: number) => string;
};

const linkClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-line bg-paper px-3 " +
  "text-sm font-medium text-ink-900 transition-colors hover:border-faint hover:bg-canvas";

const disabledClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-line bg-paper px-3 " +
  "text-sm font-medium text-faint opacity-60 select-none";

/**
 * URL-driven Prev/Next pagination with a "Showing X–Y of Z" range readout.
 * Renders nothing when there are no results at all.
 */
export function Pagination({ page, pageSize, total, hrefFor }: PaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
    >
      <p className={cn("text-xs text-muted", "tabular-nums")}>
        Showing {from.toLocaleString("en-US")}&ndash;{to.toLocaleString("en-US")} of{" "}
        {total.toLocaleString("en-US")}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          {hasPrev ? (
            <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
              &larr; Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={disabledClass}>
              &larr; Previous
            </span>
          )}
          <span className="text-xs text-muted tabular-nums">
            Page {page} of {totalPages}
          </span>
          {hasNext ? (
            <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
              Next &rarr;
            </Link>
          ) : (
            <span aria-disabled="true" className={disabledClass}>
              Next &rarr;
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
