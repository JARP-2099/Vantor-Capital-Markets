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
        <p className="text-xs font-medium text-faint">
          List your company
        </p>
        <Link href="/founder" className="text-sm font-medium text-slate-650 hover:text-ink-900">
          Save &amp; exit
        </Link>
      </div>
      <div className="mt-4">
        <WizardProgress companyId={companyId} current={step} />
      </div>
      <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </Container>
  );
}
