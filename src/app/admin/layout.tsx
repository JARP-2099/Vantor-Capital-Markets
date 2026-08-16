import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppSidebar, type SidebarNavSection } from "@/components/layout/app-sidebar";
import { ForbiddenError, requireAdmin, UnauthorizedError, type AuthedUser } from "@/lib/authz";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

const NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: "Review",
    items: [
      { href: "/admin", label: "Queue", exact: true },
      { href: "/admin/verifications", label: "Verifications" },
    ],
  },
  {
    title: "Registry",
    items: [
      { href: "/admin/companies", label: "Companies" },
      { href: "/admin/users", label: "Users" },
    ],
  },
];

const FOOTER_LINKS = [{ href: "/", label: "Back to site" }];

/**
 * Admin chrome (V2 sidebar shell). The layout gates the whole segment — signed-out users go to
 * login, signed-in non-admins get a 404 (no hint that /admin exists) — but
 * this is defense in depth only: every admin page and every server action
 * calls requireAdmin() itself. Layouts are not a security boundary.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let admin: AuthedUser;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login");
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <AppSidebar
        sections={NAV_SECTIONS}
        userName={admin.name}
        userEmail={admin.email}
        tag="ADMIN"
        footerLinks={FOOTER_LINKS}
      />
      <div className="min-w-0 flex-1 bg-canvas">
        <main>{children}</main>
      </div>
    </div>
  );
}
