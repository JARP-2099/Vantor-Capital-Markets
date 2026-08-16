import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getSessionUser } from "@/lib/authz";

export const metadata: Metadata = {
  title: "Founder",
  robots: { index: false },
};

/**
 * Segment-level auth gate: runs above the pages' Suspense boundaries so
 * unauthenticated requests get a real 307 to /login (not a streamed 200).
 * Defense-in-depth only — every page/action still performs its own
 * requireUser / requireCompanyManager checks.
 */
export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <AppSidebar
        sections={[
          {
            items: [
              { href: "/founder", label: "My Companies", exact: true },
              { href: "/founder/onboarding/new", label: "List a Company" },
            ],
          },
        ]}
        userName={user.name}
        userEmail={user.email}
        footerLinks={[{ href: "/companies", label: "View marketplace" }]}
      />
      <div className="flex-1 min-w-0 bg-canvas">{children}</div>
    </div>
  );
}
