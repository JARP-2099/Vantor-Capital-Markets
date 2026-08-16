import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Temporary typographic wordmark — no icon, no symbol. The final identity
 * arrives later; header space and brand tokens are reserved for it.
 */
export function Logo({
  className,
  href = "/",
  withLabel = false,
}: {
  className?: string;
  href?: string;
  withLabel?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-baseline gap-2 transition-opacity hover:opacity-80", className)}
    >
      <span className="text-base font-bold tracking-[0.22em] text-ink-900">VANTOR</span>
      {withLabel ? (
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-faint lg:inline">
          Capital Markets
        </span>
      ) : null}
    </Link>
  );
}
