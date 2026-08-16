import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  href?: string;
  variant?: "light" | "dark";
  /** Show the CAPITAL MARKETS sub-line under the wordmark. */
  full?: boolean;
};

/**
 * Text wordmark only for this phase — the final Vantor logo asset will be
 * supplied later and drops into this component (keep the fixed-height
 * lockup so headers don't shift when it lands).
 */
export function Logo({ className, href = "/", variant = "light", full = false }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="Vantor — home"
      className={cn(
        "inline-flex flex-col justify-center transition-opacity hover:opacity-80",
        className,
      )}
    >
      <span
        className={cn(
          "text-base font-bold leading-none tracking-[0.18em]",
          variant === "dark" ? "text-white" : "text-ink-900",
        )}
      >
        VANTOR
      </span>
      {full ? (
        <span
          className={cn(
            "mt-1 font-mono text-[8px] font-medium leading-none tracking-[0.34em]",
            variant === "dark" ? "text-white/50" : "text-muted",
          )}
        >
          CAPITAL MARKETS
        </span>
      ) : null}
    </Link>
  );
}
