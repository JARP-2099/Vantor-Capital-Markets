"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type NavLink = { href: string; label: string };

/** Disclosure-based mobile menu; closes when a link is chosen. */
export function MobileNav({ links, signedIn }: { links: NavLink[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-ink-900 hover:bg-mist"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </button>
      <div
        id={menuId}
        className={cn(
          "absolute inset-x-0 top-16 border-b border-line bg-paper shadow-raised",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-900 hover:bg-mist"
            >
              {l.label}
            </Link>
          ))}
          {!signedIn ? (
            <>
              <Link href="/login" onClick={close} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-900 hover:bg-mist">
                Sign In
              </Link>
              <Link href="/signup" onClick={close} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-900 hover:bg-mist">
                List Your Company
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
