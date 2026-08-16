import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { getSessionUser } from "@/lib/authz";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Signed-in users have no business on the sign-in/sign-up forms; sending
  // them to the dashboard avoids confusing double-login states.
  const user = await getSessionUser();
  if (user) redirect("/founder");
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
