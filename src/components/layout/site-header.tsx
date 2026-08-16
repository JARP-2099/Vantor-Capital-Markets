import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser, getUserRoles } from "@/lib/authz";
import { MobileNav } from "@/components/layout/mobile-nav";

const navLinkClass =
  "text-sm font-medium text-white/65 hover:text-white transition-colors px-1 py-2";

/**
 * Public site header (server component) — V2: dark night bar across all
 * public surfaces. Nav items adapt to session state; presentation only —
 * every destination re-checks authorization.
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  const roles = user ? await getUserRoles(user) : null;
  const admin = roles?.has("admin") ?? false;

  const links = [
    { href: "/companies", label: "Discover" },
    ...(user ? [{ href: "/founder", label: "My Companies" }] : []),
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-950/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Logo variant="dark" />
          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navLinkClass}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm text-white/55" title={user.email}>
                {user.name}
              </span>
              <ButtonLink href={admin ? "/admin" : "/founder"} variant="primary" size="sm">
                Open dashboard
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink
                href="/login"
                variant="ghost"
                size="sm"
                className="text-white/80 hover:bg-white/10 hover:text-white active:bg-white/15"
              >
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary" size="sm">
                List Your Company
              </ButtonLink>
            </>
          )}
        </div>
        <MobileNav links={links} signedIn={Boolean(user)} />
      </Container>
    </header>
  );
}
