import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Optional ?next= return path (e.g. sign-in-to-save flows). Validated here,
 * server-side: only same-site absolute paths pass — anything else (external
 * URLs, protocol-relative "//host", garbage) falls back to the default.
 */
function safeNextPath(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return undefined;
  }
  return raw;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return <LoginForm next={safeNextPath(sp.next)} />;
}
