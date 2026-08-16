/**
 * Discovery signals: factual, explainable marketplace context computed from
 * data the platform legitimately holds. Signals describe what happened
 * (published recently, edited recently, verification progress) — they are
 * never recommendations, rankings, or quality scores, and every label must
 * survive the copy rules in the development playbook.
 *
 * Pure functions with an injected clock so behavior is deterministic in tests.
 */

export const NEW_TO_VANTOR_DAYS = 30;
export const RECENTLY_UPDATED_DAYS = 14;
/**
 * Publishing itself touches updated_at, and small same-day touches follow it
 * (e.g. visibility toggles), so an update only counts as a founder edit when
 * it lands meaningfully after publication.
 */
export const MEANINGFUL_UPDATE_GAP_MS = 60 * 60 * 1000;
export const HIGHLY_VERIFIED_MIN_PCT = 80;
export const HIGHLY_VERIFIED_MIN_CATEGORIES = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type DiscoverySignalKey = "new_to_vantor" | "recently_updated" | "highly_verified";

export type DiscoverySignal = {
  key: DiscoverySignalKey;
  label: string;
  /** Plain-English explanation surfaced to users (tooltip/accessible text). */
  explanation: string;
};

export type DiscoverySignalInput = {
  publishedAt: Date | null;
  updatedAt: Date | null;
  /** Public verification stats; null when the company has no submissions. */
  verifiedPct: number | null;
  submittedCategories: number;
  now: Date;
};

export function isNewToVantor(publishedAt: Date | null, now: Date): boolean {
  if (!publishedAt) return false;
  const age = now.getTime() - publishedAt.getTime();
  return age >= 0 && age <= NEW_TO_VANTOR_DAYS * DAY_MS;
}

export function isRecentlyUpdated(
  publishedAt: Date | null,
  updatedAt: Date | null,
  now: Date,
): boolean {
  if (!publishedAt || !updatedAt) return false;
  const age = now.getTime() - updatedAt.getTime();
  if (age < 0 || age > RECENTLY_UPDATED_DAYS * DAY_MS) return false;
  return updatedAt.getTime() - publishedAt.getTime() > MEANINGFUL_UPDATE_GAP_MS;
}

export function isHighlyVerified(verifiedPct: number | null, submittedCategories: number): boolean {
  return (
    verifiedPct !== null &&
    verifiedPct >= HIGHLY_VERIFIED_MIN_PCT &&
    submittedCategories >= HIGHLY_VERIFIED_MIN_CATEGORIES
  );
}

/**
 * All signals that apply, in display-priority order. "New to Vantor"
 * suppresses "Recently updated": a listing published this month is expected
 * to be in motion, and stacking both chips reads as noise.
 */
export function computeDiscoverySignals(input: DiscoverySignalInput): DiscoverySignal[] {
  const signals: DiscoverySignal[] = [];

  if (isHighlyVerified(input.verifiedPct, input.submittedCategories)) {
    signals.push({
      key: "highly_verified",
      label: "Highly verified",
      explanation: `At least ${HIGHLY_VERIFIED_MIN_PCT}% of the information categories this company submitted (${HIGHLY_VERIFIED_MIN_CATEGORIES} or more) have been verified by Vantor review.`,
    });
  }

  if (isNewToVantor(input.publishedAt, input.now)) {
    signals.push({
      key: "new_to_vantor",
      label: "New to Vantor",
      explanation: `Published on Vantor within the last ${NEW_TO_VANTOR_DAYS} days.`,
    });
  } else if (isRecentlyUpdated(input.publishedAt, input.updatedAt, input.now)) {
    signals.push({
      key: "recently_updated",
      label: "Recently updated",
      explanation: `The company updated its profile information within the last ${RECENTLY_UPDATED_DAYS} days.`,
    });
  }

  return signals;
}
