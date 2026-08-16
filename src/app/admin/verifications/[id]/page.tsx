import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyByIdUnscoped } from "@/db/queries/companies";
import { getEvidenceForRequest, getVerificationRequestById } from "@/db/queries/verifications";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { MonoId } from "@/components/admin/mono-id";
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

export const metadata: Metadata = { title: "Admin — Review Verification" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Dense label/value row for the lifecycle definition list. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-2 sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-ink-900 [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

function TextValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="font-normal text-faint">—</span>;
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
      <div>
        <Link
          href="/admin/verifications"
          className="text-sm font-medium text-muted transition-colors hover:text-ink-900"
        >
          ← Back to queue
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{categoryLabel}</h1>
          <VerificationStatusBadge status={status} />
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Verification request for{" "}
          <Link
            href={`/admin/companies/${company.id}`}
            className="font-medium text-accent-700 hover:underline"
          >
            {company.name}
          </Link>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          <MonoId value={request.id} className="text-faint" />
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <span>Submitted {formatDate(request.createdAt)}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* -------------------------------------------------- Request content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Claim</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-650">
                {request.claimSummary}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardBody>
              {evidence.length === 0 ? (
                <p className="pt-2 text-sm text-faint">No evidence attached yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {evidence.map((item) => (
                    <li key={item.id} className="py-3 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">
                          {EVIDENCE_KIND_LABELS[item.kind as EvidenceKind]}
                        </Badge>
                        <span className="text-xs text-faint">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-650">
                        {item.description}
                      </p>
                      {item.reference ? (
                        // Deliberately plain text, never a hyperlink — the
                        // reference is founder-supplied and untrusted.
                        <p className="mt-1 break-all font-mono text-xs text-muted">
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
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Internal notes</CardTitle>
                  <Badge tone="ink">Admin-only</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Internal — never shown to founders or the public.
                </p>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-650">
                  {request.internalNotes}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {/* Decision panel — ordered first on mobile so the decision actions
            are reachable without scrolling past the whole request. */}
        <div className="order-first min-w-0 space-y-6 lg:order-none">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardBody>
              <DecisionPanel requestId={request.id} status={status} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-1">
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
                  <MonoId value={request.submittedBy} chars={12} />
                </Row>
                <Row label="Reviewed by">
                  {request.reviewedBy ? (
                    <MonoId value={request.reviewedBy} chars={12} />
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
