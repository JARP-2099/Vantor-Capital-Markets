import Link from "next/link";
import { cn } from "@/lib/cn";

/*
 * Vantor brand lockups, built from the supplied identity assets:
 * - VantorMark: vector reproduction of the primary V mark (solid left limb,
 *   rising blade, sliced counter-limb). Renders in currentColor.
 * - Logo: mark + serif wordmark, the composition used across site chrome.
 * The wordmark face is Playfair Display (--font-vantor-serif), matched to
 * the supplied banner; the "Capital Markets" line keeps its wide tracking.
 */

const MARK_MASK_ID = "vantor-mark-cuts";

export function VantorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="12 13 81 71"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id={MARK_MASK_ID} maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
          <rect x="-20" y="-20" width="140" height="140" fill="#fff" />
          <line x1="17.6" y1="104.2" x2="95.3" y2="0" stroke="#000" strokeWidth="2.6" />
          <line x1="22.6" y1="107.9" x2="100.3" y2="3.7" stroke="#000" strokeWidth="2.6" />
        </mask>
      </defs>
      <g fill="currentColor" mask={`url(#${MARK_MASK_ID})`}>
        <path d="M14 22 L36 22 L50 46.5 L64 22 L86 22 L54.5 82 L45.5 82 Z" />
        <path d="M45.56 68.92 L82.62 19.2 L90.28 14.96 L48.44 71.08 Z" />
      </g>
    </svg>
  );
}

type LogoSize = "sm" | "md" | "lg";

const sizeStyles: Record<
  LogoSize,
  { mark: string; word: string; label: string; gap: string }
> = {
  sm: {
    mark: "h-[18px]",
    word: "text-[15px] tracking-[0.14em]",
    label: "text-[6.5px] tracking-[0.3em]",
    gap: "gap-2.5",
  },
  md: {
    mark: "h-[24px]",
    word: "text-[17px] tracking-[0.15em]",
    label: "text-[7px] tracking-[0.32em]",
    gap: "gap-3",
  },
  lg: {
    mark: "h-[34px]",
    word: "text-[24px] tracking-[0.16em]",
    label: "text-[10px] tracking-[0.34em]",
    gap: "gap-3.5",
  },
};

export function Logo({
  className,
  href = "/",
  withLabel = false,
  size = "md",
  stacked = false,
}: {
  className?: string;
  href?: string;
  withLabel?: boolean;
  size?: LogoSize;
  stacked?: boolean;
}) {
  const s = sizeStyles[size];
  return (
    <Link
      href={href}
      aria-label="Vantor Capital Markets"
      className={cn(
        "group flex shrink-0 items-center text-ink-900 transition-opacity hover:opacity-80",
        stacked ? "flex-col gap-3" : s.gap,
        className,
      )}
    >
      <VantorMark className={cn("w-auto", s.mark)} />
      <span className={cn("flex flex-col", stacked && "items-center")}>
        <span className={cn("font-serif font-semibold leading-none text-ink-900", s.word)}>
          VANTOR
        </span>
        {withLabel ? (
          <span
            className={cn(
              "mt-[5px] font-medium uppercase leading-none text-faint",
              s.label,
              stacked && "text-center",
            )}
          >
            Capital&nbsp;Markets
          </span>
        ) : null}
      </span>
    </Link>
  );
}
