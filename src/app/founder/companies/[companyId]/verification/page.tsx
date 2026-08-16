import type { Metadata } from "next";
import Link from "next/link";
import { requireManagerPage } from "@/components/founder/data";
import { AddEvidenceForm } from "@/components/founder/verification/add-evidence-form";
import { SubmitRequestForm } from "@/components/founder/verification/submit-request-form";
import { VerificationStatusBadge } from "@/components/founder/verification/verification-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedBar } from "@/components/ui/charts";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getCompanyVerificationRequests,
  getLatestRequestsByCategory,
} from "@/db/queries/verifications";
import { addVerificationEvidence, submitVerificationRequest } from "@/lib/actions/verification";
import { formatDate } from "@/lib/format";
import {
  VERIFICATION_CATEGORIES,
  VERIFICATION_CATEGORY_LABELS,
  type VerificationCategory,
  type VerificationStatus,
} from "@/lib/verification/constants";

export const metadata: Metadata = { title: "Verification" };

type SegmentTone = "positive" | "warn" | "negative" | "neutral";

/**
 * Category status → completeness-bar tone. Verified is the only "done"
 * state; partial and in-review read as progress; rejected/needs-update
 * need attention; everything else (not submitted, pending, expired) is
 * neutral.
 */
function segmentTone(status: VerificationStatus | undefined): SegmentTone {
  switch (status) {
    case "verified":
      return "positive";
    case "partially_verified":
    case "under_review":
      return "warn";
    case "rejected":
    case "needs_update":
      return "negative";
    default:
      return "neutral";
  }
}

export default async function VerificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ companyId }, { category: requestedCategory }] = await Promise.all([
    params,
    searchParams,
  ]);
  await requireManagerPage(companyId);

  const [latestByCategory, history] = await Promise.all([
    getLatestRequestsByCategory(companyId),
    getCompanyVerificationRequests(companyId),
  ]);

  const blockedCategories = VERIFICATION_CATEGORIES.filter((category) => {
    const status = latestByCategory.get(category)?.status;
    return status === "pending" || status === "under_review";
  });
  const blocked = new Set(blockedCategories);
  const defaultCategory = VERIFICATION_CATEGORIES.find((c) => c === requestedCategory);

  const segments = VERIFICATION_CATEGORIES.map((category) => ({
    tone: segmentTone(latestByCategory.get(category)?.status as VerificationStatus | undefined),
  }));
  const verifiedCount = segments.filter((s) => s.tone === "positive").length;
  const verifiedPercent = Math.round((verifiedCount / VERIFICATION_CATEGORIES.length) * 100);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Data verification"
        description="Verification means Vantor has reviewed evidence supporting a specific claim about your company — for example your revenue or ownership structure. It never scores or endorses your company as an investment; it only confirms what the evidence shows."
      />

      {/* --------------------------------------------- Completeness summary */}
      <section className="rounded-lg border border-line bg-paper p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Categories verified
          </p>
          <p className="text-sm text-muted">
            {verifiedCount} of {VERIFICATION_CATEGORIES.length} categories
          </p>
        </div>
        <p
          data-metric-value
          className="mt-1 text-3xl font-extrabold tracking-tight text-ink-900 tabular-nums"
        >
          {verifiedPercent}%
        </p>
        <SegmentedBar className="mt-4" segments={segments} />
        <p className="mt-2 text-xs text-muted">
          One segment per category — green verified, amber partial or under review, red needs
          attention, grey not submitted. Details below.
        </p>
      </section>

      {/* ------------------------------------------------- Category status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification status by category</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-line">
            {VERIFICATION_CATEGORIES.map((category) => {
              const latest = latestByCategory.get(category);
              const status = latest?.status as VerificationStatus | undefined;
              const canRequest = !latest || !blocked.has(category);
              return (
                <li key={category} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                      <p className="text-sm font-semibold text-ink-900">
                        {VERIFICATION_CATEGORY_LABELS[category]}
                      </p>
                      {latest ? (
                        <p className="mt-0.5 text-xs text-muted">
                          Latest request submitted {formatDate(latest.createdAt)}
                        </p>
                      ) : null}
                    </div>
                    {status ? (
                      <VerificationStatusBadge status={status} dot />
                    ) : (
                      <Badge tone="neutral" dot>
                        Not submitted
                      </Badge>
                    )}
                    {canRequest ? (
                      <Link
                        href={`?category=${category}#request-verification`}
                        className="text-sm font-medium text-accent-700 transition-colors hover:text-accent-600"
                      >
                        {latest ? "Submit again" : "Submit information"}
                        <span aria-hidden="true"> &rarr;</span>
                        <span className="sr-only">
                          {" "}
                          for {VERIFICATION_CATEGORY_LABELS[category]}
                        </span>
                      </Link>
                    ) : null}
                  </div>
                  {latest?.founderNote ? (
                    <p className="mt-2 max-w-2xl rounded-md bg-canvas px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-slate-650">
                      <span className="font-semibold text-ink-900">
                        Note from the review team:{" "}
                      </span>
                      {latest.founderNote}
                    </p>
                  ) : null}
                  {latest && status === "needs_update" ? (
                    <details className="mt-3 max-w-2xl rounded-md border border-line">
                      <summary className="cursor-pointer select-none rounded-md px-3 py-2 text-sm font-medium text-accent-700 transition-colors hover:bg-canvas [&::-webkit-details-marker]:hidden">
                        Add evidence to this request
                      </summary>
                      <div className="space-y-4 border-t border-line p-3">
                        <AddEvidenceForm
                          action={addVerificationEvidence.bind(null, companyId)}
                          requestId={latest.id}
                        />
                      </div>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {/* ---------------------------------------------------- New request */}
      <Card id="request-verification" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Request verification</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Pick a category, state the claim you want verified, and optionally point us at the
            first piece of evidence.
          </p>
        </CardHeader>
        <CardBody>
          <SubmitRequestForm
            action={submitVerificationRequest.bind(null, companyId)}
            blockedCategories={blockedCategories}
            defaultCategory={defaultCategory}
          />
        </CardBody>
      </Card>

      {/* -------------------------------------------------------- History */}
      <Card>
        <CardHeader>
          <CardTitle>Request history</CardTitle>
        </CardHeader>
        <CardBody>
          {history.length === 0 ? (
            <p className="text-sm text-faint">
              No verification requests yet — submit information above to start one.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {history.map((request) => (
                <li key={request.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-ink-900">
                      {VERIFICATION_CATEGORY_LABELS[request.category as VerificationCategory]}
                    </span>
                    <VerificationStatusBadge status={request.status as VerificationStatus} dot />
                    <span className="text-xs text-faint tabular-nums">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                    {request.claimSummary}
                  </p>
                  {request.founderNote ? (
                    <p className="mt-1.5 max-w-2xl rounded-md bg-canvas px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-slate-650">
                      <span className="font-semibold text-ink-900">
                        Note from the review team:{" "}
                      </span>
                      {request.founderNote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
