"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Queue", exact: true },
  { href: "/admin/companies", label: "Companies", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/verifications", label: "Verifications", exact: false },
] as const;

/**
 * Admin section nav: a dense tab row under the dark top bar. Always visible —
 * on small screens the row scrolls horizontally instead of disappearing.
 * Client component only for active-tab highlighting via the pathname.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="border-t border-white/10">
      <Container>
        <div className="flex items-center gap-1 overflow-x-auto">
          {ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-accent-300 text-white"
                    : "border-transparent text-white/60 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}
