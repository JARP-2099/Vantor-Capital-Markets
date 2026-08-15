import { cn } from "@/lib/cn";

type MetricStatProps = {
  label: string;
  /** Preformatted display value; pass null/undefined when unknown. */
  value: string | null | undefined;
  tone?: "default" | "positive" | "negative";
  className?: string;
};

/**
 * Standard metric tile. Unknown values render as "Not provided" — a metric
 * of zero and a missing metric are never displayed the same way.
 */
export function MetricStat({ label, value, tone = "default", className }: MetricStatProps) {
  const known = value !== null && value !== undefined && value !== "";
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd
        data-metric-value
        className={cn(
          "mt-0.5 truncate text-lg font-semibold",
          !known && "text-faint font-normal text-sm mt-1.5",
          known && tone === "positive" && "text-positive-700",
          known && tone === "negative" && "text-negative-700",
          known && tone === "default" && "text-ink-900",
        )}
      >
        {known ? value : "Not provided"}
      </dd>
    </div>
  );
}
