import { cn } from "@/lib/cn";

/**
 * Subtle placeholder identity for companies without a supplied logo (V3 §7):
 * quiet tinted square, hairline border, muted initials. The tint is a
 * deterministic hash of the company name over a small desaturated palette —
 * enough per-company identity to make browsing feel like a marketplace
 * rather than a screener, while staying far from bright accent blocks.
 * When real company logo assets exist, they render in this same slot.
 */

const TINTS = [
  "border-line bg-[#EDF2FB] text-[#3D5580]",
  "border-line bg-[#E9F4F0] text-[#2F6B5D]",
  "border-line bg-[#F1EFFA] text-[#55497E]",
  "border-line bg-[#F9F2E7] text-[#7A5A2E]",
  "border-line bg-[#F9EEEF] text-[#7E4750]",
  "border-line bg-[#EEF1F5] text-[#404B60]",
] as const;

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

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
        "flex shrink-0 select-none items-center justify-center rounded-md border font-semibold",
        tintFor(name),
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
