import { Container } from "@/components/layout/container";
import { CompanyCard } from "@/components/founder/company-card";
import { getCompanyCounts, requireUserPage } from "@/components/founder/data";
import { computeCompletion } from "@/components/founder/profile-completion";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCompaniesManagedBy, getCompanyIntents } from "@/db/queries/companies";

export default async function FounderDashboardPage() {
  const user = await requireUserPage();
  const companies = await getCompaniesManagedBy(user.id);
  const ids = companies.map((c) => c.id);
  const [intentsByCompany, countsByCompany] = await Promise.all([
    getCompanyIntents(ids),
    getCompanyCounts(ids),
  ]);

  const withCompletion = companies.map((company) => {
    const counts = countsByCompany.get(company.id) ?? { metrics: 0, members: 0 };
    return {
      company,
      completion: computeCompletion({
        company,
        intentsCount: intentsByCompany.get(company.id)?.length ?? 0,
        metricsCount: counts.metrics,
        teamCount: counts.members,
      }),
    };
  });

  return (
    <Container wide className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Founder
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            My Companies
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            Manage your profiles, metrics, and what investors see on Vantor.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ButtonLink href="/founder/onboarding/new">List a Company</ButtonLink>
        </div>
      </div>

      <div className="mt-6">
        {companies.length === 0 ? (
          <EmptyState
            title="You haven't listed a company yet"
            description="Create a standardized profile — your story, your metrics, your team — and decide exactly what becomes public. It takes about ten minutes, and you can save a draft at any point."
            action={<ButtonLink href="/founder/onboarding/new">List a Company</ButtonLink>}
          />
        ) : (
          <div className="space-y-4">
            {withCompletion.map(({ company, completion }) => (
              <CompanyCard key={company.id} company={company} completion={completion} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
