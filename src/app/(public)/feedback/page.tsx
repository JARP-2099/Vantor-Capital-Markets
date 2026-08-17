import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Card, CardBody } from "@/components/ui/card";
import { getSessionUser } from "@/lib/authz";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Beta Feedback",
  robots: { index: false },
};

export default async function FeedbackPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/feedback")}`);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Beta feedback</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Vantor is in private beta. Tell us what is confusing, broken, or missing. We read
            everything.
          </p>
        </header>
        <Card className="mt-6">
          <CardBody className="pt-5">
            <FeedbackForm />
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
