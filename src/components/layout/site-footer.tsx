import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { href: "/companies", label: "Discover Companies" },
      { href: "/signup", label: "List Your Company" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <Container className="py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Private-company discovery, standardized startup intelligence, valuation, and
              verification — in one platform.
            </p>
          </div>
          <div className="flex gap-16">
            {columns.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  {col.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-slate-650 transition-colors hover:text-ink-900"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            Vantor Capital Markets is not a registered broker-dealer, funding portal, securities
            exchange, alternative trading system, investment adviser, or custodian, and does not
            offer, sell, or facilitate transactions in securities. Company information on this
            platform is provided by the companies themselves and has not been independently
            verified unless expressly stated. Nothing on this platform is investment advice or a
            recommendation.
          </p>
          <p className="mt-4 text-xs text-muted">
            © {new Date().getFullYear()} Vantor Capital Markets
          </p>
        </div>
      </Container>
    </footer>
  );
}
