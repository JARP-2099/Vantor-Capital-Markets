"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type ManageNavProps = { companyId: string };

export function ManageNav({ companyId }: ManageNavProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const base = `/founder/companies/${companyId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/profile`, label: "Profile" },
    { href: `${base}/metrics`, label: "Metrics" },
    { href: `${base}/team`, label: "Team" },
    { href: `${base}/valuation`, label: "Valuation" },
    { href: `${base}/verification`, label: "Verification" },
  ];

  // Keep the active tab in view when the strip scrolls horizontally (mobile).
  useEffect(() => {
    const active = listRef.current?.querySelector('[aria-current="page"]');
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [pathname]);

  return (
    <div className="relative">
      <nav
        aria-label="Company sections"
        className="-mb-px overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul ref={listRef} className="flex min-w-max gap-1 pr-10 sm:pr-0">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-block border-b-2 px-2.5 py-2.5 text-sm font-medium transition-colors sm:px-3",
                    active
                      ? "border-accent-600 font-semibold text-ink-900"
                      : "border-transparent text-muted hover:border-line-strong hover:text-ink-900",
                  )}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Scroll affordance: soft fade at both clipped edges on narrow screens. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper to-transparent sm:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-paper to-transparent sm:hidden"
      />
    </div>
  );
}
