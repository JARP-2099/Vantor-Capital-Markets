import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
