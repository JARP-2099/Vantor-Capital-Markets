/**
 * Platform feature flags.
 *
 * Vantor is not currently a registered broker-dealer, funding portal,
 * exchange, ATS, investment adviser, or custodian. Every capability that
 * would require regulated infrastructure is gated behind these flags and
 * MUST default to false. Flipping one of these on is a product + legal
 * decision, not a code change to make casually.
 */
export const features = {
  /** Actual investment transactions (checkout, money movement). Phase 10+. */
  investmentsEnabled: false,
  /** Regulated primary offerings (funding rounds open to investors). Phase 9+. */
  regulatedOfferingsEnabled: false,
  /** Secondary transfers / liquidity. Phase 12. */
  secondaryMarketEnabled: false,
  /** Binding acquisition transactions. Phase 6+ (marketplace), Phase 9+ (transactions). */
  acquisitionTransactionsEnabled: false,
  /** Vantor valuation engine V1 (deterministic estimates; Phase 2). */
  valuationsEnabled: true,
  /** Data verification foundation (Phase 3): categories, evidence, admin review. */
  verificationEnabled: true,
  /** Investor watchlists. Schema exists; UI ships in Phase 4. */
  watchlistsEnabled: false,
} as const;

export type FeatureFlag = keyof typeof features;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return features[flag];
}
