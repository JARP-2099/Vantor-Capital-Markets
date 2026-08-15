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

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Founder dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Build and manage your company profiles on Vantor.
          </p>
        </div>
        <ButtonLink href="/founder/onboarding/new" size="lg">
          List Your Company
        </ButtonLink>
      </div>

      <div className="mt-8">
        {companies.length === 0 ? (
          <EmptyState
            title="You haven't listed a company yet"
            description="Create a standardized profile — your story, your metrics, your team — and decide exactly what becomes public. It takes about ten minutes, and you can save a draft at any point."
            action={<ButtonLink href="/founder/onboarding/new">List Your Company</ButtonLink>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => {
              const counts = countsByCompany.get(company.id) ?? { metrics: 0, members: 0 };
              const completion = computeCompletion({
                company,
                intentsCount: intentsByCompany.get(company.id)?.length ?? 0,
                metricsCount: counts.metrics,
                teamCount: counts.members,
              });
              return (
                <CompanyCard
                  key={company.id}
                  company={company}
                  completionPercent={completion.percent}
                />
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
