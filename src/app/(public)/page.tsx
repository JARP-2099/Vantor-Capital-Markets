import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";

const pillars = [
  {
    title: "Standardized profiles",
    body: "Every company presents the same clear structure — story, metrics, team — so understanding a private company doesn't require a data room.",
  },
  {
    title: "Real company data",
    body: "Founders report their own metrics with history and context. No fabricated prices, no invented valuations.",
  },
  {
    title: "Built for what's next",
    body: "The platform is architected for future valuation, verification, and regulated investment infrastructure — added deliberately, in stages.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-ink-900 text-white">
        <Container className="py-20 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            Private Markets, Made Legible
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Discover and understand private companies.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Vantor is a private startup marketplace. Founders build standardized company
            profiles. Investors explore private companies with the clarity of a public-market
            terminal.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink
              href="/companies"
              size="lg"
              className="bg-white text-ink-900 hover:bg-mist active:bg-line"
            >
              Discover Companies
            </ButtonLink>
            <ButtonLink
              href="/signup"
              size="lg"
              variant="secondary"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:border-white/40 active:bg-white/15"
            >
              List Your Company
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Pillars */}
      <section>
        <Container className="py-16 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title}>
                <h2 className="text-base font-semibold text-ink-900">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Founder CTA */}
      <section className="border-t border-line bg-paper">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">
              Founders: put your company on the map.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Build a structured profile in minutes — your story, your metrics, your team —
              and signal whether you&apos;re raising, open to strategic conversations, or open
              to acquisition offers. You control what becomes public.
            </p>
            <ButtonLink href="/signup" className="mt-6">
              Start Your Profile
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
