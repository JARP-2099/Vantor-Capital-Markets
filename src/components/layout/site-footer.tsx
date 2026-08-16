import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-deep">
      <Container className="py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <Logo size="lg" />
          <nav aria-label="Footer" className="flex gap-6 pt-1 text-sm text-slate-650">
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
