import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/authz";
import { safeNextPath } from "@/lib/safe-next-path";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  // Signed-in users have no business on the sign-in form; send them where
  // they were headed (validated same-site path) or to the dashboard.
  const user = await getSessionUser();
  if (user) redirect(next ?? "/founder");
  return <LoginForm next={next} />;
}
