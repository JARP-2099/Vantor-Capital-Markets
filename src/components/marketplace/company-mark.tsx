import { cn } from "@/lib/cn";

/**
 * Subtle placeholder identity for companies without a supplied logo (V3 §7):
 * quiet mist square, hairline border, muted initials. Deliberately NOT a
 * bright accent block — placeholder identity should recede, not brand every
 * row cobalt. When real company logo assets exist, they render in this
 * same fixed-size slot.
 */
export function CompanyMark({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-md border border-line bg-mist font-semibold text-slate-650",
        size === "sm" && "size-8 text-[11px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-14 rounded-lg text-base",
        className,
      )}
    >
      {initials || "•"}
    </span>
  );
}
