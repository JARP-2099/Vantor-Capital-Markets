import { Logo } from "@/components/layout/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Signed-in users are redirected away in the login/signup pages (not here:
  // layouts cannot read searchParams, and the redirect must honor ?next=).
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <Logo className="mb-10" size="lg" stacked />
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 max-w-md text-center text-xs leading-relaxed text-faint">
        Vantor Capital Markets is not a registered broker-dealer, funding portal, or
        securities exchange. Nothing on this platform is investment advice.
      </p>
    </main>
  );
}
