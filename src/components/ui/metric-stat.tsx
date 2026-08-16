import { cn } from "@/lib/cn";

type MetricStatProps = {
  label: string;
  /** Preformatted display value; pass null/undefined when unknown. */
  value: string | null | undefined;
  tone?: "default" | "positive" | "negative";
  /** Small supporting line under the value (period, source, caveat). */
  hint?: string;
  /** lg = headline numbers (valuation, dashboard); md = standard tiles. */
  size?: "md" | "lg";
  className?: string;
};

/**
 * Standard metric tile. Unknown values render as an em dash — a metric of
 * zero and a missing metric are never displayed the same way. Values are
 * always tabular so metric rows align.
 */
export function MetricStat({
  label,
  value,
  tone = "default",
  hint,
  size = "md",
  className,
}: MetricStatProps) {
  const known = value !== null && value !== undefined && value !== "";
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd
        data-metric-value
        className={cn(
          "truncate tracking-tight",
          size === "lg" ? "mt-1 text-2xl font-semibold" : "mt-0.5 text-lg font-semibold",
          !known && "font-normal text-faint",
          known && tone === "positive" && "text-positive-700",
          known && tone === "negative" && "text-negative-700",
          known && tone === "default" && "text-ink-900",
        )}
      >
        {known ? value : "—"}
      </dd>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
