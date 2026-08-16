import { Container } from "@/components/layout/container";
import { CompanyCard } from "@/components/founder/company-card";
import { getCompanyCounts, requireUserPage } from "@/components/founder/data";
import { computeCompletion } from "@/components/founder/profile-completion";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
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

  const single = withCompletion.length === 1;

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        as="h1"
        eyebrow="Founder"
        title="Your companies"
        description="Manage your profiles, metrics, and what investors see on Vantor."
        actions={<ButtonLink href="/founder/onboarding/new">List Your Company</ButtonLink>}
      />

      <div className="mt-8">
        {companies.length === 0 ? (
          <EmptyState
            title="You haven't listed a company yet"
            description="Create a standardized profile — your story, your metrics, your team — and decide exactly what becomes public. It takes about ten minutes, and you can save a draft at any point."
            action={<ButtonLink href="/founder/onboarding/new">List Your Company</ButtonLink>}
          />
        ) : single ? (
          <CompanyCard
            company={withCompletion[0].company}
            completion={withCompletion[0].completion}
            wide
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {withCompletion.map(({ company, completion }) => (
              <CompanyCard key={company.id} company={company} completion={completion} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
