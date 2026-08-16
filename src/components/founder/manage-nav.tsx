"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type ManageNavProps = { companyId: string };

export function ManageNav({ companyId }: ManageNavProps) {
  const pathname = usePathname();
  const base = `/founder/companies/${companyId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/profile`, label: "Profile" },
    { href: `${base}/metrics`, label: "Metrics" },
    { href: `${base}/team`, label: "Team" },
    { href: `${base}/valuation`, label: "Valuation" },
    { href: `${base}/verification`, label: "Verification" },
  ];

  return (
    <nav aria-label="Company sections" className="-mb-px overflow-x-auto">
      <ul className="flex min-w-max gap-1">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-ink-900 text-ink-900"
                    : "border-transparent text-muted hover:border-line hover:text-ink-900",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
