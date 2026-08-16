import { Logo, VMark } from "@/components/layout/logo";

/**
 * Auth chrome: dark brand panel + calm form column. The panel is purely
 * presentational; the disclaimer stays on every auth screen.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[2fr_3fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink-950 bg-grid-dark p-10 lg:flex">
        <Logo variant="dark" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-300">
            Private Capital. Rebuilt.
          </p>
          <p className="mt-4 font-serif text-4xl leading-tight text-white">
            Discover. Value.
            <br />
            Own what&rsquo;s next.
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            Standardized company profiles, model-based valuation, and evidence-based data
            verification for private companies.
          </p>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-white/50">
          Vantor Capital Markets is not a registered broker-dealer, funding portal, or
          securities exchange. Nothing on this platform is investment advice.
        </p>
        <VMark
          variant="dark"
          className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 opacity-[0.05]"
        />
      </aside>

      <div className="flex flex-col items-center justify-center bg-canvas px-4 py-12">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <p className="mt-8 max-w-md text-center text-xs leading-relaxed text-muted lg:hidden">
          Vantor Capital Markets is not a registered broker-dealer, funding portal, or
          securities exchange. Nothing on this platform is investment advice.
        </p>
      </div>
    </main>
  );
}
