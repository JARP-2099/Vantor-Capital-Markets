import Link from "next/link";
import type { CompanyMetricRow, CompanyRow } from "@/db/queries/companies";
import type { ValuationRunRow } from "@/db/queries/valuations";
import { cn } from "@/lib/cn";
import { STAGE_LABELS, type CompanyIntent, type MetricType } from "@/lib/constants";
import type { DiscoverySignal } from "@/lib/discovery/signals";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { pickGrowthMetric, pickPublicIntent, pickRevenueMetric } from "./metrics";
import { SignalChips } from "./signal-chips";
import { SignInToSaveLink, WatchButton } from "./watch-button";

/**
 * Dark table/list hybrid for the Discover marketplace: a dense financial
 * table on desktop, structured result blocks on mobile. No avatars, no
 * cards — company names stand on their own. Unknown values render as an
 * en dash, never a fabricated zero. The same component serves the Watchlist
 * page (saved rows with a saved date and remove-capable star).
 */

export type CompanyListItem = {
  company: CompanyRow;
  metrics: Map<MetricType, CompanyMetricRow> | undefined;
  intents: readonly CompanyIntent[];
  valuation: ValuationRunRow | null;
  verificationPct: number | null;
  /** Factual discovery signals for this row (optional). */
  signals?: DiscoverySignal[];
  /** Whether the signed-in viewer has saved this company (optional). */
  saved?: boolean;
  /** When the viewer saved it — shown on the Watchlist surface. */
  savedAt?: Date | null;
};

/**
 * Watchlist controls config for the table. Omit to render no save UI.
 * `next` is the path sign-in should return to for signed-out viewers.
 */
export type WatchConfig = {
  signedIn: boolean;
  next: string;
};

function valuationRange(run: ValuationRunRow | null): string | null {
  if (!run) return null;
  const low = Number(run.valuationLow);
  const high = Number(run.valuationHigh);
  if (Number.isFinite(low) && Number.isFinite(high)) {
    return `${formatCompactCurrency(low, run.currency)} to ${formatCompactCurrency(high, run.currency)}`;
  }
  const mid = Number(run.valuationMid);
  return Number.isFinite(mid) ? formatCompactCurrency(mid, run.currency) : null;
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-line-strong bg-mist px-2 py-0.5 text-[11px] font-medium text-slate-650">
      {label}
    </span>
  );
}

const growthClass = (tone: "default" | "positive" | "negative") =>
  tone === "positive"
    ? "text-positive-700"
    : tone === "negative"
      ? "text-negative-700"
      : "text-ink-900";

export function CompanyTable({ items, watch }: { items: CompanyListItem[]; watch?: WatchConfig }) {
  const rows = items.map(({ company, metrics, intents, valuation, verificationPct, ...rest }) => {
    const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
    return {
      company,
      stageLabel,
      industryStage: [company.industry, stageLabel].filter(Boolean).join(" · "),
      revenue: pickRevenueMetric(metrics),
      growth: pickGrowthMetric(metrics),
      valuation: valuationRange(valuation),
      verificationPct,
      status: pickPublicIntent(intents),
      signals: rest.signals ?? [],
      saved: rest.saved ?? false,
      savedAt: rest.savedAt ?? null,
    };
  });

  const showSavedAt = rows.some((row) => row.savedAt);

  function watchControl(row: (typeof rows)[number]) {
    if (!watch) return null;
    return watch.signedIn ? (
      <WatchButton companyId={row.company.id} companyName={row.company.name} saved={row.saved} />
    ) : (
      <SignInToSaveLink next={watch.next} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      {/* Desktop: dense financial table; scrolls inside its own container at
          narrow tablet widths instead of overflowing the page. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium text-faint">
              <th scope="col" className="px-5 py-3 font-medium">Company</th>
              <th scope="col" className="px-5 py-3 font-medium">Industry / Stage</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Revenue</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Growth</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Est. Valuation</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Verification</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
              {showSavedAt ? (
                <th scope="col" className="px-5 py-3 font-medium">Saved</th>
              ) : null}
              {watch ? (
                // relative: contains the absolutely-positioned sr-only text so
                // it can never widen the document beyond the scroll container.
                <th scope="col" className="relative px-2 py-3">
                  <span className="sr-only">Watchlist</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.company.id} className="group transition-colors hover:bg-mist">
                <td className="max-w-64 px-5 py-3.5">
                  <Link
                    href={`/companies/${row.company.slug}`}
                    className="font-semibold text-ink-900 group-hover:text-ink-950"
                  >
                    {row.company.name}
                  </Link>
                  {row.signals.length > 0 ? (
                    <div className="mt-1">
                      <SignalChips signals={row.signals} />
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-3.5 text-slate-650">{row.industryStage || "–"}</td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                  {row.revenue?.value ?? <span className="font-normal text-faint">–</span>}
                </td>
                <td
                  className={cn(
                    "px-5 py-3.5 text-right font-medium tabular-nums",
                    row.growth ? growthClass(row.growth.tone) : undefined,
                  )}
                >
                  {row.growth?.value ?? <span className="font-normal text-faint">–</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                  {row.valuation ?? <span className="font-normal text-faint">–</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                  {row.verificationPct !== null ? (
                    `${row.verificationPct}%`
                  ) : (
                    <span className="font-normal text-faint">–</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {row.status ? <StatusChip label={row.status.label} /> : <span className="text-faint">–</span>}
                </td>
                {showSavedAt ? (
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted tabular-nums">
                    {row.savedAt ? formatDate(row.savedAt) : "–"}
                  </td>
                ) : null}
                {watch ? <td className="px-2 py-3.5 text-right">{watchControl(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: structured result blocks (no horizontal scroll) */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.company.id} className="relative">
            <Link
              href={`/companies/${row.company.slug}`}
              className="block px-4 py-4 transition-colors hover:bg-mist"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("truncate font-semibold text-ink-900", watch && "pr-8")}>
                    {row.company.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">{row.industryStage}</p>
                  {row.savedAt ? (
                    <p className="mt-0.5 text-[10px] text-faint">Saved {formatDate(row.savedAt)}</p>
                  ) : null}
                </div>
                {row.status ? <StatusChip label={row.status.label} /> : null}
              </div>
              {row.signals.length > 0 ? (
                <div className="mt-2">
                  <SignalChips signals={row.signals} />
                </div>
              ) : null}
              <dl className={cn("mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm", watch && "pr-9")}>
                <div>
                  <dt className="text-[10px] font-medium text-faint">Est. valuation</dt>
                  <dd className="mt-0.5 font-medium text-ink-900 tabular-nums">
                    {row.valuation ?? <span className="font-normal text-faint">–</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-faint">
                    Revenue
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink-900 tabular-nums">
                    {row.revenue?.value ?? <span className="font-normal text-faint">–</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-faint">
                    Growth
                  </dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-medium tabular-nums",
                      row.growth ? growthClass(row.growth.tone) : "font-normal text-faint",
                    )}
                  >
                    {row.growth?.value ?? "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-faint">
                    Verification
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink-900 tabular-nums">
                    {row.verificationPct !== null ? (
                      `${row.verificationPct}%`
                    ) : (
                      <span className="font-normal text-faint">–</span>
                    )}
                  </dd>
                </div>
              </dl>
            </Link>
            {/* Overlaid so the save control is not nested inside the row link */}
            {watch ? (
              <div className="absolute bottom-4 right-3">{watchControl(row)}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
