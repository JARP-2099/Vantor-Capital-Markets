import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyByIdUnscoped } from "@/db/queries/companies";
import { getEvidenceForRequest, getVerificationRequestById } from "@/db/queries/verifications";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { DecisionPanel } from "@/components/admin/verification/decision-panel";
import { VerificationStatusBadge } from "@/components/admin/verification/verification-status-badge";
import { Container } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  EVIDENCE_KIND_LABELS,
  VERIFICATION_CATEGORY_LABELS,
  type EvidenceKind,
  type VerificationCategory,
  type VerificationStatus,
} from "@/lib/verification/constants";

export const metadata: Metadata = { title: "Admin · Review Verification" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Label/value row for the lifecycle definition list. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-ink-900 break-words">
        {children}
      </dd>
    </div>
  );
}

function TextValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="font-normal text-faint">Not provided</span>;
  return <>{value}</>;
}

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const request = await getVerificationRequestById(id);
  if (!request) notFound();

  const [evidence, company] = await Promise.all([
    getEvidenceForRequest(id),
    getCompanyByIdUnscoped(request.companyId),
  ]);
  if (!company) notFound();

  const status = request.status as VerificationStatus;
  const categoryLabel = VERIFICATION_CATEGORY_LABELS[request.category as VerificationCategory];

  return (
    <Container className="space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink-900">{categoryLabel}</h1>
            <VerificationStatusBadge status={status} />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Verification request for{" "}
            <Link
              href={`/admin/companies/${company.id}`}
              className="font-medium text-ink-900 underline decoration-line-strong underline-offset-2 hover:decoration-faint"
            >
              {company.name}
            </Link>
          </p>
          <p className="mt-1 font-mono text-xs text-faint">{request.id}</p>
        </div>
        <Link
          href="/admin/verifications"
          className="text-sm font-medium text-slate-650 transition-colors hover:text-ink-900"
        >
          ← Back to queue
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* -------------------------------------------------- Request content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Claim</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                {request.claimSummary}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardBody>
              {evidence.length === 0 ? (
                <p className="text-sm text-faint">No evidence attached yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {evidence.map((item) => (
                    <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">
                          {EVIDENCE_KIND_LABELS[item.kind as EvidenceKind]}
                        </Badge>
                        <span className="text-xs text-faint">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                        {item.description}
                      </p>
                      {item.reference ? (
                        // Deliberately plain text, never a hyperlink — the
                        // reference is founder-supplied and untrusted.
                        <p className="mt-1 font-mono text-xs break-all text-muted">
                          {item.reference}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {request.founderNote ? (
            <Alert tone="warn" title="Note to the founder on file">
              <p className="whitespace-pre-wrap">{request.founderNote}</p>
            </Alert>
          ) : null}

          {request.internalNotes ? (
            <Card>
              <CardHeader>
                <CardTitle>Internal notes</CardTitle>
                <p className="mt-1 text-xs text-muted">
                  Visible to admins only. Never shown to the founder or the public.
                </p>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                  {request.internalNotes}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {/* ---------------------------------------------------- Decision panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardBody>
              <DecisionPanel requestId={request.id} status={status} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-line">
                <Row label="Submitted">{formatDate(request.createdAt)}</Row>
                <Row label="Last updated">{formatDate(request.updatedAt)}</Row>
                <Row label="Decided">
                  <TextValue value={request.decidedAt ? formatDate(request.decidedAt) : null} />
                </Row>
                <Row label="Expires">
                  <TextValue value={request.expiresAt ? formatDate(request.expiresAt) : null} />
                </Row>
                <Row label="Submitted by">
                  <span className="font-mono text-xs">{request.submittedBy}</span>
                </Row>
                <Row label="Reviewed by">
                  {request.reviewedBy ? (
                    <span className="font-mono text-xs">{request.reviewedBy}</span>
                  ) : (
                    <TextValue value={null} />
                  )}
                </Row>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  );
}
