import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user, userRoles } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import type { PlatformRole } from "@/lib/authz";

export const metadata: Metadata = { title: "Admin — Users" };

const thClass =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted whitespace-nowrap";
const tdClass = "px-4 py-3 text-sm text-slate-650 whitespace-nowrap";

const ROLE_TONES: Record<PlatformRole, "neutral" | "accent" | "positive" | "ink"> = {
  founder: "accent",
  investor: "positive",
  buyer: "neutral",
  admin: "ink",
};

type UserListing = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  roles: PlatformRole[];
};

export default async function AdminUsersPage() {
  await requireAdminPage();

  // One left-joined read; roles grouped per user in JS (no N+1).
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      role: userRoles.role,
    })
    .from(user)
    .leftJoin(userRoles, eq(userRoles.userId, user.id))
    .orderBy(desc(user.createdAt), asc(user.id));

  const users = new Map<string, UserListing>();
  for (const row of rows) {
    let entry = users.get(row.id);
    if (!entry) {
      entry = { id: row.id, name: row.name, email: row.email, createdAt: row.createdAt, roles: [] };
      users.set(row.id, entry);
    }
    if (row.role) entry.roles.push(row.role);
  }
  const listing = [...users.values()];

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Read-only account records. Roles come from user_roles; admins bootstrapped via
          ADMIN_EMAILS may not carry a stored role row.
        </p>
      </div>

      {listing.length === 0 ? (
        <EmptyState
          title="No users yet."
          description="Accounts appear here as people sign up."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper shadow-card">
          <table className="w-full min-w-176 border-collapse">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th scope="col" className={thClass}>
                  Name
                </th>
                <th scope="col" className={thClass}>
                  Email
                </th>
                <th scope="col" className={thClass}>
                  Roles
                </th>
                <th scope="col" className={thClass}>
                  Joined
                </th>
                <th scope="col" className={thClass}>
                  User ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listing.map((account) => (
                <tr key={account.id}>
                  <td className={`${tdClass} font-medium text-ink-900`}>{account.name}</td>
                  <td className={tdClass}>{account.email}</td>
                  <td className={tdClass}>
                    {account.roles.length === 0 ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {account.roles.map((role) => (
                          <Badge key={role} tone={ROLE_TONES[role]}>
                            {role}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className={tdClass}>{formatDate(account.createdAt)}</td>
                  <td className={`${tdClass} font-mono text-xs text-faint`}>{account.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
