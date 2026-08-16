/**
 * Trusted-origin construction for Better Auth.
 *
 * The canonical base URL (BETTER_AUTH_URL) stays the production domain; this
 * only ADDS the concrete Vercel-provided hosts for the current deployment so
 * auth also works when a deployment/preview URL is opened directly. Vercel
 * populates these system variables per deployment at runtime:
 *
 *   VERCEL_URL                     — this deployment's unique host
 *   VERCEL_BRANCH_URL              — the branch's stable alias host
 *   VERCEL_PROJECT_PRODUCTION_URL  — the project's production host
 *
 * All are bare hosts (no protocol). Deliberately NO wildcard like
 * "*.vercel.app": that would trust every Vercel customer's deployments.
 * Origin/CSRF validation itself stays fully enabled — this narrows what we
 * trust, it never disables checking.
 */

export type TrustedOriginSources = {
  betterAuthUrl: string;
  vercelUrl?: string;
  vercelBranchUrl?: string;
  vercelProjectProductionUrl?: string;
};

/** Normalizes a value that may be a bare host or a full URL into an origin. */
function toOrigin(value: string | undefined, protocol: "https" | "http"): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `${protocol}://${trimmed}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Deterministic, deduplicated origin list for better-auth `trustedOrigins`. */
export function buildTrustedOrigins(sources: TrustedOriginSources): string[] {
  const origins = [
    // Canonical app URL (production domain in prod, localhost in dev).
    toOrigin(sources.betterAuthUrl, "https"),
    // Vercel hosts are always served over https.
    toOrigin(sources.vercelUrl, "https"),
    toOrigin(sources.vercelBranchUrl, "https"),
    toOrigin(sources.vercelProjectProductionUrl, "https"),
  ];
  return [...new Set(origins.filter((o): o is string => o !== null))];
}
