"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

export type SidebarNavItem = {
  href: string;
  label: string;
  /** Match only the exact path (for index routes). */
  exact?: boolean;
};

export type SidebarNavSection = {
  title?: string;
  items: SidebarNavItem[];
};

type AppSidebarProps = {
  sections: SidebarNavSection[];
  userName: string;
  userEmail: string;
  /** Small tag next to the wordmark (e.g. ADMIN). */
  tag?: string;
  /** Extra links pinned above the user block (e.g. Back to site). */
  footerLinks?: SidebarNavItem[];
};

function NavList({
  sections,
  pathname,
  onNavigate,
}: {
  sections: SidebarNavSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Application" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {sections.map((section, i) => (
        <div key={section.title ?? i}>
          {section.title ? (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
              {section.title}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserBlock({
  userName,
  userEmail,
  footerLinks,
  pathname,
  onNavigate,
}: {
  userName: string;
  userEmail: string;
  footerLinks?: SidebarNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="border-t border-white/10 px-3 py-4">
      {footerLinks?.length ? (
        <ul className="mb-3 space-y-0.5">
          {footerLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex h-9 items-center rounded-md px-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white",
                  pathname === item.href && "bg-white/10 text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center justify-between gap-2 px-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="truncate text-xs text-white/45" title={userEmail}>
            {userEmail}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await authClient.signOut();
            router.push("/");
            router.refresh();
          }}
          className="shrink-0 rounded-md px-2.5 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/**
 * Authenticated app sidebar (V2 shell): dark night rail on desktop, top
 * bar + slide-over on mobile. Presentation only — every destination
 * re-checks authorization server-side.
 */
export function AppSidebar({ sections, userName, userEmail, tag, footerLinks }: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);

  // Close the slide-over on route change (covers browser back too) —
  // render-time state adjustment, not an effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const brand = (
    <div className="flex items-center gap-2.5 px-6 pt-6 pb-2">
      <Logo variant="dark" full />
      {tag ? (
        <span className="rounded-sm border border-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
          {tag}
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-night-950 lg:flex">
        {brand}
        <NavList sections={sections} pathname={pathname} />
        <UserBlock
          userName={userName}
          userEmail={userEmail}
          footerLinks={footerLinks}
          pathname={pathname}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-night-950 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Logo variant="dark" />
          {tag ? (
            <span className="rounded-sm border border-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
              {tag}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile slide-over */}
      <div
        id={menuId}
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-night-950/60 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={close}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-night-950 shadow-raised transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between pr-3">
            {brand}
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="mt-4 flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <NavList sections={sections} pathname={pathname} onNavigate={close} />
          <UserBlock
            userName={userName}
            userEmail={userEmail}
            footerLinks={footerLinks}
            pathname={pathname}
            onNavigate={close}
          />
        </div>
      </div>
    </>
  );
}
