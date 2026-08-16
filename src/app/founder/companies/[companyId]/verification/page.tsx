import type { Metadata } from "next";
import { requireManagerPage } from "@/components/founder/data";
import { AddEvidenceForm } from "@/components/founder/verification/add-evidence-form";
import { SubmitRequestForm } from "@/components/founder/verification/submit-request-form";
import { VerificationStatusBadge } from "@/components/founder/verification/verification-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  await requireManagerPage(companyId);

  const [latestByCategory, history] = await Promise.all([
    getLatestRequestsByCategory(companyId),
    getCompanyVerificationRequests(companyId),
  ]);

  const blockedCategories = VERIFICATION_CATEGORIES.filter((category) => {
    const status = latestByCategory.get(category)?.status;
    return status === "pending" || status === "under_review";
  });

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-ink-900">Data verification</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Verification means Vantor has reviewed evidence supporting a specific claim about your
          company, for example your revenue or ownership structure. It never scores or endorses
          your company as an investment; it only confirms what the evidence shows.
        </p>
      </div>

      {/* ------------------------------------------------- Category status */}
      <div className="grid gap-4 sm:grid-cols-2">
        {VERIFICATION_CATEGORIES.map((category) => {
          const latest = latestByCategory.get(category);
          const status = latest?.status as VerificationStatus | undefined;
          return (
            <Card key={category} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink-900">
                  {VERIFICATION_CATEGORY_LABELS[category]}
                </h3>
                {status ? (
                  <VerificationStatusBadge status={status} />
                ) : (
                  <Badge tone="neutral" className="text-muted">
                    Not submitted
                  </Badge>
                )}
              </div>
              {latest ? (
                <p className="mt-1.5 text-xs text-faint">
                  Latest request submitted {formatDate(latest.createdAt)}
                </p>
              ) : null}
              {latest?.founderNote ? (
                <p className="mt-2 rounded-md bg-canvas px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-slate-650">
                  <span className="font-semibold text-ink-900">Note from the review team: </span>
                  {latest.founderNote}
                </p>
              ) : null}
              {latest &&
              (status === "pending" || status === "under_review" || status === "needs_update") ? (
                <details className="mt-3 rounded-md border border-line">
                  <summary className="cursor-pointer select-none rounded-md px-3 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-canvas [&::-webkit-details-marker]:hidden">
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
            </Card>
          );
        })}
      </div>

      {/* ---------------------------------------------------- New request */}
      <Card>
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
            <p className="text-sm text-faint">No verification requests yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {history.map((request) => (
                <li key={request.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {VERIFICATION_CATEGORY_LABELS[request.category as VerificationCategory]}
                    </span>
                    <VerificationStatusBadge status={request.status as VerificationStatus} />
                    <span className="text-xs text-faint">{formatDate(request.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                    {request.claimSummary}
                  </p>
                  {request.founderNote ? (
                    <p className="mt-1.5 rounded-md bg-canvas px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-slate-650">
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
