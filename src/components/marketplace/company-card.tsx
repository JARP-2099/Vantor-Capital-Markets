import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CompanyMetricRow, CompanyRow } from "@/db/queries/companies";
import { cn } from "@/lib/cn";
import { STAGE_LABELS, type CompanyIntent, type MetricType } from "@/lib/constants";
import { pickGrowthMetric, pickPublicIntent, pickRevenueMetric } from "./metrics";

type CompanyCardProps = {
  company: CompanyRow;
  /** Latest metrics for this company (from batched getLatestMetrics). */
  metrics: Map<MetricType, CompanyMetricRow> | undefined;
  /** Intents this company holds (from batched getCompanyIntents). */
  intents: readonly CompanyIntent[];
};

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | null;
  tone?: "default" | "positive" | "negative";
}) {
  const known = value !== null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-sm tabular-nums",
          !known && "font-normal text-faint",
          known && tone === "default" && "font-semibold text-ink-900",
          known && tone === "positive" && "font-semibold text-positive-700",
          known && tone === "negative" && "font-semibold text-negative-700",
        )}
      >
        {known ? value : "—"}
      </dd>
    </div>
  );
}

/**
 * Standardized marketplace card. Hierarchy: name → industry • stage →
 * short description → 2x2 latest-metric mini-grid. The whole card is one
 * link to the company profile; unknown values render as an em dash, never
 * as a fabricated zero.
 */
export function CompanyCard({ company, metrics, intents }: CompanyCardProps) {
  const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
  const metaLine = [company.industry, stageLabel].filter(Boolean).join(" • ");
  const revenue = pickRevenueMetric(metrics);
  const growth = pickGrowthMetric(metrics);
  const status = pickPublicIntent(intents);

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group block h-full rounded-lg"
      aria-label={`View ${company.name}`}
    >
      <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-faint">
        <h2 className="text-base font-semibold leading-snug text-ink-900">{company.name}</h2>
        {metaLine ? <p className="mt-0.5 text-xs text-muted">{metaLine}</p> : null}
        {company.shortDescription ? (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-650">
            {company.shortDescription}
          </p>
        ) : null}

        <div aria-hidden="true" className="min-h-4 flex-1" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
          <MiniStat label={revenue?.label ?? "Revenue"} value={revenue?.value ?? null} />
          <MiniStat
            label="Growth (YoY)"
            value={growth?.value ?? null}
            tone={growth?.tone ?? "default"}
          />
          <MiniStat label="Stage" value={stageLabel} />
          {status ? (
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Status
              </dt>
              <dd className="mt-1">
                <Badge tone={status.intent === "not_raising" ? "neutral" : "accent"}>
                  {status.label}
                </Badge>
              </dd>
            </div>
          ) : null}
        </dl>

        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent-600 group-hover:text-accent-700">
          View Company
          <span aria-hidden="true">&rarr;</span>
        </span>
      </Card>
    </Link>
  );
}
