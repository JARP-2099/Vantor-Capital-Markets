import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
    <>
      <SiteHeader />
      <main className="flex-1 bg-canvas">{children}</main>
      <SiteFooter />
    </>
  );
}
