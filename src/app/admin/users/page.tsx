import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user, userRoles } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { MonoId } from "@/components/admin/mono-id";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { PlatformRole } from "@/lib/authz";

export const metadata: Metadata = { title: "Admin — Users" };

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
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Read-only directory of every account on the platform. Some administrator accounts are
          provisioned at the platform level and may not show a stored role.
        </p>
      </div>

      {listing.length === 0 ? (
        <EmptyState
          title="No users yet"
          description="Accounts appear here as people sign up."
        />
      ) : (
        <TableWrap>
          <Table className="min-w-176">
            <THead>
              <tr>
                <TH dense>Name</TH>
                <TH dense>Email</TH>
                <TH dense>Roles</TH>
                <TH dense numeric>
                  Joined
                </TH>
                <TH dense numeric>
                  User ID
                </TH>
              </tr>
            </THead>
            <TBody>
              {listing.map((account) => (
                <tr key={account.id} className="transition-colors hover:bg-mist/40">
                  <TD dense className="whitespace-nowrap font-medium text-ink-900">
                    {account.name}
                  </TD>
                  <TD dense className="whitespace-nowrap">
                    {account.email}
                  </TD>
                  <TD dense className="whitespace-nowrap">
                    {account.roles.length === 0 ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className="flex flex-wrap gap-x-3 gap-y-1">
                        {account.roles.map((role) => (
                          <Badge key={role} tone={ROLE_TONES[role]} dot className="capitalize">
                            {role}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </TD>
                  <TD dense numeric className="whitespace-nowrap">
                    {formatDate(account.createdAt)}
                  </TD>
                  <TD dense numeric className="whitespace-nowrap">
                    <MonoId value={account.id} className="text-faint" />
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}
    </Container>
  );
}
