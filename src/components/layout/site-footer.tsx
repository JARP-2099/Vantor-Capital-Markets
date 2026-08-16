import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

/**
 * Session-agnostic links only — the footer renders on both signed-in and
 * signed-out pages, and auth-state controls live in the header.
 */
const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { href: "/companies", label: "Discover Companies" },
      { href: "/signup", label: "List Your Company" },
      { href: "/founder", label: "Founder Dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-night-950 text-white">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo variant="dark" full />
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Private-company discovery, standardized startup intelligence, valuation, and
              verification — in one platform.
            </p>
          </div>
          <div className="flex gap-16">
            {columns.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                  {col.heading}
                </p>
                <ul className="mt-2">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="inline-block py-2 text-sm text-white/65 transition-colors hover:text-white"
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
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-white/45">
            Vantor Capital Markets is not a registered broker-dealer, funding portal, securities
            exchange, alternative trading system, investment adviser, or custodian, and does not
            offer, sell, or facilitate transactions in securities. Company information on this
            platform is provided by the companies themselves and has not been independently
            verified unless expressly stated. Nothing on this platform is investment advice or a
            recommendation.
          </p>
          <p className="mt-4 text-xs text-white/45">
            © {new Date().getFullYear()} Vantor Capital Markets
          </p>
        </div>
      </Container>
    </footer>
  );
}
