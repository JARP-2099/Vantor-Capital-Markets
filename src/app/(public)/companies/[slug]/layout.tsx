import { notFound } from "next/navigation";
import { getCompany } from "./company-lookup";

/**
 * Existence gate for public company profiles. Runs in the layout — before
 * the page's streamed render — so an unpublished or nonexistent slug gets a
 * real HTTP 404, not a streamed 200 with not-found UI. Unpublished and
 * nonexistent are indistinguishable by design (privacy boundary).
 */
export default async function CompanyProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  return <>{children}</>;
}
