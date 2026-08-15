import { Container } from "@/components/layout/container";
import { SkeletonBlock } from "@/components/marketplace/skeletons";
import { Card } from "@/components/ui/card";

export default function CompanyProfileLoading() {
  return (
    <>
      <p className="sr-only" role="status">
        Loading company profile
      </p>
      <div className="border-b border-line bg-paper">
        <Container className="py-10 sm:py-12">
          <SkeletonBlock className="h-8 w-80 max-w-full" />
          <SkeletonBlock className="mt-2.5 h-3.5 w-48 max-w-full" />
          <div className="mt-4 flex gap-1.5">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-5 w-24" />
          </div>
          <SkeletonBlock className="mt-5 h-4 w-full max-w-2xl" />
          <SkeletonBlock className="mt-1.5 h-4 w-4/5 max-w-xl" />
          <Card className="mt-8 p-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonBlock key={i} className="h-11" />
              ))}
            </div>
          </Card>
        </Container>
      </div>
      <div className="border-b border-line">
        <Container>
          <div className="flex gap-6 py-3.5">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        </Container>
      </div>
      <Container className="pb-16">
        <div className="pt-10">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="mt-5 h-3.5 w-full max-w-3xl" />
          <SkeletonBlock className="mt-1.5 h-3.5 w-11/12 max-w-3xl" />
          <SkeletonBlock className="mt-1.5 h-3.5 w-4/5 max-w-3xl" />
        </div>
        <div className="pt-10">
          <SkeletonBlock className="h-6 w-32" />
          <Card className="mt-5 p-5">
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonBlock key={i} className="h-6" />
              ))}
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
