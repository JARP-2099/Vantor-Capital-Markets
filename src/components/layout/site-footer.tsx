import Link from "next/link";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-deep">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.22em] text-ink-900">VANTOR</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-faint">
              Capital Markets
            </p>
          </div>
          <nav aria-label="Footer" className="flex gap-6 text-sm text-slate-650">
            <Link href="/companies" className="hover:text-ink-900">
              Discover
            </Link>
            <Link href="/signup" className="hover:text-ink-900">
              List Your Company
            </Link>
          </nav>
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-faint">
          Vantor Capital Markets is not a registered broker-dealer, funding portal, securities
          exchange, alternative trading system, investment adviser, or custodian, and does not
          offer, sell, or facilitate transactions in securities. Company information on this
          platform is provided by the companies themselves and has not been independently
          verified. Nothing on this platform is investment advice or a recommendation.
        </p>
      </Container>
    </footer>
  );
}
