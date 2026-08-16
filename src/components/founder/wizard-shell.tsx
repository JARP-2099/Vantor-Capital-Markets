import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { WizardProgress } from "@/components/founder/wizard-progress";

type WizardShellProps = {
  companyId: string | null;
  step: number;
  title: string;
  description: string;
  children: ReactNode;
};

/** Shared chrome for every onboarding step: progress, heading, save & exit. */
export function WizardShell({ companyId, step, title, description, children }: WizardShellProps) {
  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          List your company
        </p>
        <Link
          href="/founder"
          className="text-sm font-medium text-accent-700 transition-colors hover:text-accent-600"
        >
          Save &amp; exit
        </Link>
      </div>
      <div className="mt-5 border-b border-line pb-5">
        <WizardProgress companyId={companyId} current={step} />
      </div>
      <h1 className="mt-7 text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </Container>
  );
}
