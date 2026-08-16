import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Vantor brand mark: two geometric wedges converging to a single point —
 * two sides of a market meeting. The right plane carries the cobalt accent.
 * `variant="dark"` is for dark (ink) surfaces.
 */
export function VMark({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const leftFill = variant === "dark" ? "#ffffff" : "var(--color-ink-900)";
  const rightFill = variant === "dark" ? "var(--color-accent-300)" : "var(--color-accent-600)";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-6 w-6", className)}>
      <path d="M5 6h7l4 20z" fill={leftFill} />
      <path d="M20 6h7l-11 20z" fill={rightFill} />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  href?: string;
  variant?: "light" | "dark";
  /** Hide the wordmark (mark only), e.g. tight mobile headers. */
  markOnly?: boolean;
};

/** Brand lockup: V mark + tracked VANTOR wordmark. */
export function Logo({ className, href = "/", variant = "light", markOnly = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 transition-opacity hover:opacity-80",
        className,
      )}
      aria-label="Vantor — home"
    >
      <VMark variant={variant} className="h-[22px] w-[22px]" />
      {!markOnly ? (
        <span
          className={cn(
            "text-[17px] font-semibold tracking-[0.16em]",
            variant === "dark" ? "text-white" : "text-ink-900",
          )}
        >
          VANTOR
        </span>
      ) : null}
    </Link>
  );
}
