import { Logo } from "@/components/layout/logo";

/**
 * Auth chrome — V2: fast, clean fintech sign-in. Slim brand header,
 * centered form on the light canvas, compliance line at the foot.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-white/10 bg-night-950">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Logo variant="dark" full />
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-xl border border-line bg-paper p-7 shadow-card sm:p-8">
          {children}
        </div>
        <p className="mt-8 max-w-md text-center text-xs leading-relaxed text-muted">
          Vantor Capital Markets is not a registered broker-dealer, funding portal, or
          securities exchange. Nothing on this platform is investment advice.
        </p>
      </div>
    </main>
  );
}
