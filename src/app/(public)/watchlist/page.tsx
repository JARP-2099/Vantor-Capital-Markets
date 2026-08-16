import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { CompanyTable, type CompanyListItem } from "@/components/marketplace/company-table";
import { WatchButton } from "@/components/marketplace/watch-button";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCompanyIntents, getLatestMetrics } from "@/db/queries/companies";
import { getLatestCompletedValuationRuns } from "@/db/queries/valuations";
import { getPublicVerificationStats } from "@/db/queries/verifications";
import { getWatchlistItems } from "@/db/queries/watchlists";
import { features } from "@/config/features";
import { getSessionUser } from "@/lib/authz";
import { computeDiscoverySignals } from "@/lib/discovery/signals";

export const metadata: Metadata = {
  title: "Watchlist",
  robots: { index: false },
};

/**
 * The signed-in user's saved companies. Auth is enforced here with a real
 * redirect (matching the founder segment's pattern) and again in the query
 * layer, which only ever reads rows scoped to the session user.
 */
export default async function WatchlistPage() {
  if (!features.watchlistsEnabled) notFound();

  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/watchlist")}`);

  const allItems = await getWatchlistItems(user.id);
  const available = allItems.filter(
    (item): item is typeof item & { company: NonNullable<(typeof item)["company"]> } =>
      item.company !== null,
  );
  const unavailable = allItems.filter((item) => item.company === null);

  // Batched context for the saved companies — same lookups as Discover.
  const companyIds = available.map((item) => item.company.id);
  const valuationEligibleIds = features.valuationsEnabled
    ? available.filter((item) => item.company.showPublicValuation).map((item) => item.company.id)
    : [];
  const [metricsByCompany, intentsByCompany, valuationsByCompany, verificationStats] =
    await Promise.all([
      getLatestMetrics(companyIds),
      getCompanyIntents(companyIds),
      getLatestCompletedValuationRuns(valuationEligibleIds),
      features.verificationEnabled
        ? getPublicVerificationStats(companyIds)
        : Promise.resolve(new Map<string, { verifiedPct: number; submittedCount: number }>()),
    ]);

  const now = new Date();
  const items: CompanyListItem[] = available.map(({ company, savedAt }) => {
    const stats = verificationStats.get(company.id) ?? null;
    return {
      company,
      metrics: metricsByCompany.get(company.id),
      intents: intentsByCompany.get(company.id) ?? [],
      valuation: valuationsByCompany.get(company.id) ?? null,
      verificationPct: stats?.verifiedPct ?? null,
      signals: computeDiscoverySignals({
        publishedAt: company.publishedAt,
        updatedAt: company.updatedAt,
        verifiedPct: stats?.verifiedPct ?? null,
        submittedCategories: stats?.submittedCount ?? 0,
        now,
      }),
      saved: true,
      savedAt,
    };
  });

  return (
    <Container size="product" className="py-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">
          Watchlist
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-faint">
          Companies you saved to review later. Saves are private to your account.
        </p>
      </header>

      <div className="mt-6 space-y-6">
        {items.length > 0 ? (
          <CompanyTable items={items} watch={{ signedIn: true, next: "/watchlist" }} />
        ) : (
          <EmptyState
            title="No saved companies yet"
            description="Use the star on any company in Discover, or the Save button on a company profile, to keep it here for later review."
            action={
              <ButtonLink href="/companies" variant="secondary" size="sm">
                Browse companies
              </ButtonLink>
            }
          />
        )}

        {unavailable.length > 0 ? (
          <section aria-labelledby="watchlist-unavailable-heading">
            <h2 id="watchlist-unavailable-heading" className="text-sm font-semibold text-ink-900">
              No longer available
            </h2>
            <p className="mt-1 text-xs text-faint">
              {unavailable.length === 1 ? "This company is" : "These companies are"} no longer
              listed on Vantor.
            </p>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
              {unavailable.map((item) => (
                <li key={item.companyId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-muted">Unlisted company</span>
                  <WatchButton
                    companyId={item.companyId}
                    companyName="this unlisted company"
                    saved
                    variant="labeled"
                    savedLabel="Remove"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
