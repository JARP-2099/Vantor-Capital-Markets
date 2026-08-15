import { Container } from "@/components/layout/container";
import { CompanyGridSkeleton, SkeletonBlock } from "@/components/marketplace/skeletons";
import { Card } from "@/components/ui/card";

export default function CompaniesLoading() {
  return (
    <Container className="py-10 sm:py-12">
      <p className="sr-only" role="status">
        Loading companies
      </p>
      <SkeletonBlock className="h-8 w-72 max-w-full" />
      <SkeletonBlock className="mt-3 h-3 w-96 max-w-full" />
      <Card className="mt-6 hidden p-4 md:block">
        <SkeletonBlock className="h-10 w-full" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
        </div>
      </Card>
      <Card className="mt-6 p-4 md:hidden">
        <SkeletonBlock className="h-6 w-24" />
      </Card>
      <div className="mt-6">
        <CompanyGridSkeleton count={6} />
      </div>
    </Container>
  );
}
