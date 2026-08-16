import "server-only";
import { cache } from "react";
import { getPublishedCompanyBySlug } from "@/db/queries/companies";

/**
 * Per-request cached slug lookup shared by the segment layout,
 * generateMetadata, and the page so the three run one query total.
 */
export const getCompany = cache(getPublishedCompanyBySlug);
