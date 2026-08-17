import type { Metadata } from "next";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getRecentFeedback } from "@/db/queries/feedback";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Beta Feedback" };

const ROLE_LABELS = { founder: "Founder", investor: "Investor", other: "Other" } as const;

export default async function AdminFeedbackPage() {
  await requireAdminPage();
  const entries = await getRecentFeedback(200);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Beta feedback</h1>
        <p className="mt-1 text-sm text-muted">
          What beta users reported, newest first. Feedback is private to admins.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="Feedback submitted through the beta feedback form will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-line bg-paper p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center rounded-full border border-line-strong bg-mist px-2 py-0.5 font-medium text-slate-650">
                  {ROLE_LABELS[entry.role]}
                </span>
                <span className="font-medium text-ink-900">
                  {entry.authorName ?? "Deleted account"}
                </span>
                {entry.authorEmail ? <span>{entry.authorEmail}</span> : null}
                {entry.pagePath ? <span>Context: {entry.pagePath}</span> : null}
                <span className="tabular-nums">{formatDate(entry.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-650">
                {entry.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
