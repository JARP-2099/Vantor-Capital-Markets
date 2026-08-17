import Link from "next/link";
import { features } from "@/config/features";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser, getUserRoles } from "@/lib/authz";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { MobileNav } from "@/components/layout/mobile-nav";

const navLinkClass =
  "text-sm font-medium text-slate-650 hover:text-ink-900 transition-colors px-1 py-2";

/**
 * Public site header (server component). Compact dark navigation; nav items
 * adapt to session state — presentation only, every destination re-checks
 * authorization.
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  const roles = user ? await getUserRoles(user) : null;
  const admin = roles?.has("admin") ?? false;

  const links = [
    { href: "/companies", label: "Discover" },
    ...(user && features.watchlistsEnabled ? [{ href: "/watchlist", label: "Watchlist" }] : []),
    { href: "/signup", label: "For Founders" },
    ...(user ? [{ href: "/founder", label: "Founder" }] : []),
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-5 md:flex">
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
              {/* Hidden below lg: with the full signed-in nav (Discover,
                  Watchlist, Founder, Admin) the name no longer fits at 768. */}
              <span className="hidden max-w-40 truncate text-sm text-muted lg:inline" title={user.email}>
                {user.name}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign In
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
