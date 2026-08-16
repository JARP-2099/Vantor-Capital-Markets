import { cn } from "@/lib/cn";

/*
 * Vantor financial visualization primitives — V2 decisions §Charts.
 * Dependency-free inline SVG/CSS. Each maps to a ui-ux-pro-max database
 * recommendation:
 *  - RangeBar          → bullet chart (KPI vs range, space-constrained)
 *  - ConfidenceBand    → line with confidence band (estimate uncertainty)
 *  - SegmentedBar      → waffle/fraction-of-whole, linearized
 *  - TrendLine         → compact single-series history
 * Charts are never the only data carrier — pair with labeled values or a
 * table. Tones stay semantic: cobalt = interactive/brand data, green/red
 * reserved for meaning.
 */

type RangeBarProps = {
  /** Normalized 0–1 positions inside the track. */
  bandStart: number;
  bandEnd: number;
  mid?: number;
  lowLabel?: string;
  midLabel?: string;
  highLabel?: string;
  /** Dark = on night surfaces. */
  surface?: "light" | "dark";
  /** Adds .reveal-bar so the band grows when inside a Reveal. */
  reveal?: boolean;
  className?: string;
};

/** Bullet-style valuation range: track, low–high band, midpoint marker. */
export function RangeBar({
  bandStart,
  bandEnd,
  mid,
  lowLabel,
  midLabel,
  highLabel,
  surface = "light",
  reveal = false,
  className,
}: RangeBarProps) {
  const start = Math.max(0, Math.min(1, bandStart));
  const end = Math.max(start, Math.min(1, bandEnd));
  const midPos = mid !== undefined ? Math.max(start, Math.min(end, mid)) : undefined;
  const dark = surface === "dark";
  return (
    <div className={className}>
      <div
        className={cn(
          "relative h-2.5 overflow-hidden rounded-full",
          dark ? "bg-white/10" : "bg-mist",
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 rounded-full",
            dark ? "bg-accent-500" : "bg-accent-600",
            reveal && "reveal-bar",
          )}
          style={{ left: `${start * 100}%`, width: `${(end - start) * 100}%` }}
        />
        {midPos !== undefined ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full",
              dark ? "bg-white" : "bg-ink-900",
            )}
            style={{ left: `calc(${midPos * 100}% - 1px)` }}
          />
        ) : null}
      </div>
      {lowLabel || midLabel || highLabel ? (
        <div
          className={cn(
            "mt-2 flex items-baseline justify-between gap-2 text-xs tabular-nums",
            dark ? "text-white/55" : "text-muted",
          )}
        >
          <span>{lowLabel}</span>
          {midLabel ? (
            <span className={cn("font-semibold", dark ? "text-white" : "text-ink-900")}>
              {midLabel}
            </span>
          ) : null}
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export type BandPoint = {
  /** 0–1 position on the x axis (precomputed by the caller). */
  x: number;
  low: number;
  mid: number;
  high: number;
};

type ConfidenceBandProps = {
  points: BandPoint[];
  /** Accessible narration of the series. */
  label: string;
  height?: number;
  surface?: "light" | "dark";
  /** Adds draw-in transition hooks for use inside a Reveal. */
  reveal?: boolean;
  className?: string;
};

/**
 * Line-with-confidence-band: low–high band with the midpoint line — the
 * honest shape of an estimate over time. No axes ticks by design; pair
 * with a data table for exact values.
 */
export function ConfidenceBand({
  points,
  label,
  height = 120,
  surface = "light",
  reveal = false,
  className,
}: ConfidenceBandProps) {
  if (points.length < 2) return null;
  const W = 600;
  const H = 100;
  const pad = 4;
  const values = points.flatMap((p) => [p.low, p.high]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const px = (x: number) => pad + x * (W - 2 * pad);
  const py = (v: number) => H - pad - ((v - min) / span) * (H - 2 * pad);

  const midPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(1)} ${py(p.mid).toFixed(1)}`)
    .join(" ");
  const bandPath =
    points.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(1)} ${py(p.high).toFixed(1)}`).join(" ") +
    " " +
    [...points]
      .reverse()
      .map((p) => `L${px(p.x).toFixed(1)} ${py(p.low).toFixed(1)}`)
      .join(" ") +
    " Z";
  const last = points[points.length - 1];
  const dark = surface === "dark";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("w-full", className)}
      style={{ height }}
    >
      <path d={bandPath} className={dark ? "fill-accent-500/15" : "fill-accent-600/12"} />
      <path
        d={midPath}
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={600}
        className={cn(dark ? "stroke-accent-400" : "stroke-accent-600", reveal && "reveal-draw")}
        style={reveal ? ({ "--draw-length": "600" } as React.CSSProperties) : undefined}
      />
      <circle
        cx={px(last.x)}
        cy={py(last.mid)}
        r={3.5}
        className={dark ? "fill-white" : "fill-ink-900"}
      />
    </svg>
  );
}

type SegmentedBarProps = {
  segments: { tone: "positive" | "warn" | "negative" | "neutral" | "accent" }[];
  surface?: "light" | "dark";
  className?: string;
};

const segmentTones: Record<string, { light: string; dark: string }> = {
  positive: { light: "bg-positive-700", dark: "bg-positive-400" },
  warn: { light: "bg-warn-700", dark: "bg-warn-400" },
  negative: { light: "bg-negative-700", dark: "bg-negative-400" },
  accent: { light: "bg-accent-600", dark: "bg-accent-400" },
  neutral: { light: "bg-line-strong", dark: "bg-white/15" },
};

/** Fraction-of-whole as discrete segments (one per category). */
export function SegmentedBar({ segments, surface = "light", className }: SegmentedBarProps) {
  return (
    <div aria-hidden="true" className={cn("flex h-2 gap-1", className)}>
      {segments.map((s, i) => (
        <div
          key={i}
          className={cn("flex-1 rounded-full", segmentTones[s.tone][surface])}
        />
      ))}
    </div>
  );
}

type TrendLineProps = {
  /** Values oldest → newest; x spacing is uniform. */
  values: number[];
  label: string;
  height?: number;
  surface?: "light" | "dark";
  /** Fill the area under the line. */
  area?: boolean;
  className?: string;
};

/** Compact single-series history line for metric trends. */
export function TrendLine({
  values,
  label,
  height = 56,
  surface = "light",
  area = true,
  className,
}: TrendLineProps) {
  if (values.length < 2) return null;
  const W = 300;
  const H = 60;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const px = (i: number) => pad + (i / (values.length - 1)) * (W - 2 * pad);
  const py = (v: number) => H - pad - ((v - min) / span) * (H - 2 * pad);
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  const dark = surface === "dark";
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("w-full", className)}
      style={{ height }}
    >
      {area ? (
        <path
          d={`${line} L${px(values.length - 1)} ${H - pad} L${px(0)} ${H - pad} Z`}
          className={dark ? "fill-accent-500/12" : "fill-accent-600/10"}
        />
      ) : null}
      <path
        d={line}
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dark ? "stroke-accent-400" : "stroke-accent-600"}
      />
      <circle
        cx={px(values.length - 1)}
        cy={py(values[values.length - 1])}
        r={3}
        className={dark ? "fill-white" : "fill-ink-900"}
      />
    </svg>
  );
}
