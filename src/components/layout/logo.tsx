import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark. Typographic, no icon — precise and institutional. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-lg font-bold tracking-[0.18em] text-ink-900 hover:opacity-80 transition-opacity",
        className,
      )}
    >
      VANTOR
    </Link>
  );
}
